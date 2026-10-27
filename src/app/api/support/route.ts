// Support Tickets API
// GET  /api/support - list tickets (admin: all; customer: own)
// POST /api/support - create ticket
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateTicketNumber } from '@/lib/security';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const assignedToMe = url.searchParams.get('mine') === '1';

  const where: any = {};
  if (user.customer && !hasPermission(user, 'support.view' as any)) {
    where.customerId = user.customer.id;
  }
  if (status) where.status = status;
  if (assignedToMe) where.assignedTo = user.id;

  const tickets = await db.supportTicket.findMany({
    where,
    include: {
      customer: true,
      assignee: true,
      replies: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok({ tickets });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { subject, description, category, priority = 'NORMAL', channel = 'WEB', relatedOrderId, relatedProductId } = body;

  if (!subject || !description) return badRequest('Subject and description are required');

  const ticketCount = await db.supportTicket.count();
  const ticketNumber = generateTicketNumber(ticketCount + 1);

  const ticket = await db.supportTicket.create({
    data: {
      ticketNumber,
      customerId: user.customer?.id || null,
      channel,
      subject,
      description,
      category: category || 'OTHER',
      priority,
      status: 'OPEN',
      relatedOrderId: relatedOrderId || null,
      relatedProductId: relatedProductId || null,
    },
  });

  await logAudit({
    userId: user.id,
    action: 'support.ticket_create',
    entityType: 'SupportTicket',
    entityId: ticket.id,
    metadata: { ticketNumber, subject },
    ipAddress: getClientIp(req),
  });

  return ok({ ticket });
});
