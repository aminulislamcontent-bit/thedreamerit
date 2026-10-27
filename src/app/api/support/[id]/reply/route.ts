// POST /api/support/[id]/reply - reply to a support ticket
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const POST = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { content, isInternal = false } = body;

  if (!content) return badRequest('Reply content is required');

  const ticket = await db.supportTicket.findUnique({ where: { id } });
  if (!ticket) return notFound('Ticket not found');

  // Permission: customer can reply to own ticket, agent with support.respond can reply to any
  if (user.customer) {
    if (ticket.customerId !== user.customer.id) return forbidden();
  } else if (!hasPermission(user, 'support.respond' as any)) {
    return forbidden();
  }

  const reply = await db.supportTicketReply.create({
    data: {
      ticketId: id,
      userId: user.id,
      authorName: user.name,
      authorRole: user.customer ? 'CUSTOMER' : 'AGENT',
      content,
      isInternal: isInternal && hasPermission(user, 'support.respond' as any),
    },
  });

  // Update ticket status
  if (user.customer) {
    await db.supportTicket.update({
      where: { id },
      data: { status: 'OPEN', updatedAt: new Date() },
    });
  } else {
    await db.supportTicket.update({
      where: { id },
      data: { status: 'IN_PROGRESS', assignedTo: user.id, updatedAt: new Date() },
    });
  }

  await logAudit({
    userId: user.id,
    action: 'support.reply',
    entityType: 'SupportTicket',
    entityId: id,
    metadata: { isInternal, authorRole: user.customer ? 'CUSTOMER' : 'AGENT' },
    ipAddress: getClientIp(req),
  });

  return ok({ reply });
});
