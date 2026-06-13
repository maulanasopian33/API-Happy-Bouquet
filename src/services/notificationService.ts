import db from '../models';
import nodemailer from 'nodemailer';
import { getIO } from '../socket';
import logger from '../utils/logger';

const NotificationTemplate = db.NotificationTemplate;
const NotificationLog = db.NotificationLog;

let transporter: any = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP configuration is incomplete. Emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

export const renderTemplate = (body: string, variables: Record<string, any>): string => {
  let result = body;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }
  return result;
};

export const sendInAppNotification = async (
  userId: number | null,
  templateCode: string,
  variables: Record<string, any>
) => {
  try {
    const template = await NotificationTemplate.findOne({
      where: { code: templateCode, channel: 'in_app', is_active: true }
    });

    const body = template 
      ? renderTemplate(template.body, variables)
      : `Notification: ${templateCode}`;

    const log = await NotificationLog.create({
      user_id: userId,
      recipient: userId ? String(userId) : 'all',
      channel: 'in_app',
      template_code: templateCode,
      subject: null,
      body,
      status: 'sent',
      sent_at: new Date(),
    });

    try {
      const io = getIO();
      if (userId) {
        io.to(`user_${userId}`).emit('notification', {
          id: log.id,
          body,
          template_code: templateCode,
          createdAt: log.createdAt
        });
      } else {
        io.emit('notification', {
          id: log.id,
          body,
          template_code: templateCode,
          createdAt: log.createdAt
        });
      }
    } catch (ioErr: any) {
      logger.debug('Socket.io broadcast skipped: ' + ioErr.message);
    }

    return log;
  } catch (error) {
    logger.error('Failed to send in-app notification', { error, userId, templateCode });
    throw error;
  }
};

export const sendEmailNotification = async (
  to: string,
  templateCode: string,
  variables: Record<string, any>,
  userId: number | null = null
) => {
  let log: any = null;
  try {
    const template = await NotificationTemplate.findOne({
      where: { code: templateCode, channel: 'email', is_active: true }
    });

    const subject = template?.subject 
      ? renderTemplate(template.subject, variables)
      : `Happy Bouquet Notification`;
    const body = template 
      ? renderTemplate(template.body, variables)
      : `Notification: ${templateCode}`;

    log = await NotificationLog.create({
      user_id: userId,
      recipient: to,
      channel: 'email',
      template_code: templateCode,
      subject,
      body,
      status: 'pending',
    });

    const client = getTransporter();
    if (!client) {
      throw new Error('SMTP client is not configured');
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@happybouquet.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Happy Bouquet System';

    await client.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: body,
    });

    await log.update({
      status: 'sent',
      sent_at: new Date(),
    });

    logger.info('Email notification sent successfully', { templateCode, to });
    return log;
  } catch (error: any) {
    logger.error('Failed to send email notification', { error, to, templateCode });
    if (log) {
      await log.update({
        status: 'failed',
        error_message: error.message,
      });
    }
    throw error;
  }
};

export const getNotificationLogs = async (userId: number, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await NotificationLog.findAndCountAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    logs: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};
