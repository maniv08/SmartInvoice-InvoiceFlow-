import cron from 'node-cron';
import { Invoice, Setting, Notification, User, RecurringTemplate } from '../models';
import { sendEmailNotification } from './emailService';

export const runReminderCheck = async (): Promise<{
  processedInvoices: number;
  remindersSent: number;
  overdueMarked: number;
  recurringGenerated: number;
}> => {
  console.log('⏰ Running automated reminder and invoice lifecycle scheduler job...');

  const now = new Date();
  let remindersSent = 0;
  let overdueMarked = 0;
  let recurringGenerated = 0;

  // 1. Fetch settings for each organization
  const settingsList = await Setting.find({});
  const settingsMap = new Map();
  for (const s of settingsList) {
    settingsMap.set(s.organization.toString(), s);
  }

  // 2. Process Pre-Due & Post-Due Invoices
  const activeInvoices = await Invoice.find({
    status: { $in: ['PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PROCESSING', 'UNDER_VERIFICATION', 'SUBMITTED', 'OVERDUE'] },
  }).populate('vendor', 'name email contactPerson');

  for (const invoice of activeInvoices) {
    const orgId = invoice.organization.toString();
    const setting = settingsMap.get(orgId);
    const preDueDays = setting?.reminderConfig?.preDueDays || [7, 3, 1];
    const postDueDays = setting?.reminderConfig?.postDueDays || [1, 7, 15];

    const dueDate = new Date(invoice.dueDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if overdue and update status if not paid
    if (diffDays < 0 && invoice.status !== 'PAID' && invoice.status !== 'OVERDUE') {
      invoice.status = 'OVERDUE';
      await invoice.save();
      overdueMarked++;
    }

    // Pre-due reminders (e.g. 7, 3, 1 days remaining)
    if (diffDays > 0 && preDueDays.includes(diffDays)) {
      const reminderTag = `PRE_DUE_${diffDays}D`;
      const alreadySent = invoice.remindersSent.some((r) => r.reminderType === reminderTag);

      if (!alreadySent) {
        invoice.remindersSent.push({
          reminderType: reminderTag,
          sentAt: new Date(),
          recipient: (invoice.vendor as any)?.email || 'finance@invoiceflow.io',
        });
        await invoice.save();
        remindersSent++;

        // Send In-App Notification to Finance Managers
        const financeUsers = await User.find({ organization: invoice.organization, role: 'FINANCE_MANAGER' });
        for (const fu of financeUsers) {
          await Notification.create({
            user: fu._id,
            organization: invoice.organization,
            title: `Payment Due in ${diffDays} Days: Invoice ${invoice.invoiceNumber}`,
            message: `Invoice ${invoice.invoiceNumber} for ${(invoice.vendor as any)?.name} (₹${invoice.totalAmount.toLocaleString('en-IN')}) is due on ${dueDate.toLocaleDateString()}.`,
            type: 'PAYMENT_DUE',
            link: `/invoices/${invoice._id}`,
            metadata: { invoiceId: invoice._id, diffDays },
          });
        }
      }
    }

    // Post-due reminders (e.g. 1, 7, 15 days overdue)
    const overdueDays = -diffDays;
    if (overdueDays > 0 && postDueDays.includes(overdueDays)) {
      const reminderTag = `POST_DUE_${overdueDays}D`;
      const alreadySent = invoice.remindersSent.some((r) => r.reminderType === reminderTag);

      if (!alreadySent) {
        invoice.remindersSent.push({
          reminderType: reminderTag,
          sentAt: new Date(),
          recipient: (invoice.vendor as any)?.email || 'finance@invoiceflow.io',
        });
        await invoice.save();
        remindersSent++;

        const financeUsers = await User.find({ organization: invoice.organization, role: 'FINANCE_MANAGER' });
        for (const fu of financeUsers) {
          await Notification.create({
            user: fu._id,
            organization: invoice.organization,
            title: `⚠️ ESCALATION: Invoice ${invoice.invoiceNumber} is ${overdueDays} Days Overdue`,
            message: `Invoice ${invoice.invoiceNumber} for ${(invoice.vendor as any)?.name} of ₹${invoice.totalAmount.toLocaleString('en-IN')} is severely overdue!`,
            type: 'PAYMENT_OVERDUE',
            link: `/invoices/${invoice._id}`,
            metadata: { invoiceId: invoice._id, overdueDays },
          });
        }
      }
    }
  }

  // 3. Process Recurring Invoice Templates
  const dueTemplates = await RecurringTemplate.find({
    isActive: true,
    nextRunDate: { $lte: now },
  }).populate('vendor');

  for (const template of dueTemplates) {
    const nextInvNumber = `INV-REC-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const adminUser = await User.findOne({ organization: template.organization, role: 'ADMIN' });

    await Invoice.create({
      invoiceNumber: nextInvNumber,
      vendor: template.vendor._id,
      organization: template.organization,
      description: `Recurring Generated Invoice: ${template.title}`,
      issueDate,
      dueDate,
      paymentTerms: template.paymentTerms || 'Net 30',
      currency: 'INR',
      items: template.items,
      subtotal: template.subtotal,
      taxRate: template.taxRate,
      taxAmount: template.taxAmount,
      discountAmount: 0,
      totalAmount: template.totalAmount,
      status: 'SUBMITTED',
      createdBy: adminUser?._id,
      currentApprovalStep: 1,
      requiredApprovalSteps: template.totalAmount > 100000 ? 3 : template.totalAmount >= 10000 ? 2 : 1,
      attachments: [],
      notes: `Auto-generated by recurring schedule template "${template.title}".`,
    });

    // Update next run date
    const nextRun = new Date(template.nextRunDate);
    if (template.frequency === 'MONTHLY') {
      nextRun.setMonth(nextRun.getMonth() + 1);
    } else if (template.frequency === 'QUARTERLY') {
      nextRun.setMonth(nextRun.getMonth() + 3);
    } else if (template.frequency === 'YEARLY') {
      nextRun.setFullYear(nextRun.getFullYear() + 1);
    } else if (template.frequency === 'WEEKLY') {
      nextRun.setDate(nextRun.getDate() + 7);
    }

    template.nextRunDate = nextRun;
    template.lastGeneratedDate = now;
    await template.save();
    recurringGenerated++;
  }

  console.log(`✅ Scheduler completed: ${remindersSent} reminders, ${overdueMarked} marked overdue, ${recurringGenerated} recurring invoices generated.`);
  return {
    processedInvoices: activeInvoices.length,
    remindersSent,
    overdueMarked,
    recurringGenerated,
  };
};

export const startReminderCron = () => {
  // Run daily at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    try {
      await runReminderCheck();
    } catch (err) {
      console.error('Cron job error:', err);
    }
  });

  console.log('🕒 Reminder & Invoice Scheduler Cron initialized.');
};
