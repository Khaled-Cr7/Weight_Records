import type { Response } from "express";
import { prisma } from "./prisma.js";
import { isUuid } from "./routineShape.js";

// What the signed-in user may do with a program or routine:
//   "owned"    - theirs, can change it
//   "readonly" - ready-made, can read and copy it but not change it
//   "missing"  - doesn't exist, was deleted, or belongs to someone else
export type Access = "owned" | "readonly" | "missing";

export async function programAccess(id: string, userId: string): Promise<Access> {
  if (!isUuid(id)) return "missing";
  const program = await prisma.program.findFirst({
    where: { id, deletedAt: null, OR: [{ ownerId: null }, { ownerId: userId }] },
    select: { ownerId: true },
  });
  if (!program) return "missing";
  return program.ownerId === null ? "readonly" : "owned";
}

export async function routineAccess(id: string, userId: string): Promise<Access> {
  if (!isUuid(id)) return "missing";
  const routine = await prisma.routine.findFirst({
    where: { id, deletedAt: null, OR: [{ ownerId: null }, { ownerId: userId }] },
    select: { ownerId: true },
  });
  if (!routine) return "missing";
  return routine.ownerId === null ? "readonly" : "owned";
}

// Sends the error response unless the user owns the thing. Returns true when it answered.
export function denyUnlessOwned(res: Response, access: Access, noun: "Program" | "Routine"): boolean {
  if (access === "owned") return false;
  if (access === "readonly") {
    res.status(403).json({ error: `Ready-made ${noun.toLowerCase()}s can't be changed. Add it to your own first.` });
  } else {
    res.status(404).json({ error: `${noun} not found` });
  }
  return true;
}