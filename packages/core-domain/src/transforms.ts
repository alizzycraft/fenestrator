import type { TerminologyMap, TerminologyEntry } from '@fenestrator/schemas';
import type { ProfileMeta } from '@fenestrator/schemas';

export interface ResolvedProfile {
  meta: ProfileMeta;
  terminology: TerminologyMap;
  framingMd: string;
  styleRules: Record<string, unknown>;
}

/**
 * TRANSFORM: Merge parent terminology into child, child values win.
 * Marks entries as inherited if they come from the parent.
 */
export function mergeTerminology(
  parent: TerminologyMap,
  child: TerminologyMap,
  parentProfileId: string,
): TerminologyMap {
  const merged: TerminologyMap = {};

  for (const [term, entry] of Object.entries(parent)) {
    merged[term] = { ...entry, inherited: true, profileId: parentProfileId };
  }

  for (const [term, entry] of Object.entries(child)) {
    merged[term] = { ...entry, inherited: false };
  }

  return merged;
}

/**
 * TRANSFORM: Detect terminology conflicts between parent and child.
 * Returns conflict messages.
 */
export function detectTerminologyConflicts(
  parent: TerminologyMap,
  child: TerminologyMap,
): string[] {
  const conflicts: string[] = [];

  for (const [term, childEntry] of Object.entries(child)) {
    const parentEntry = parent[term];
    if (!parentEntry) continue;

    if (parentEntry.avoid?.includes(childEntry.preferred)) {
      conflicts.push(
        `Term "${term}": child preferred "${childEntry.preferred}" is in parent avoid list`,
      );
    }
    if (childEntry.avoid?.includes(parentEntry.preferred)) {
      conflicts.push(
        `Term "${term}": parent preferred "${parentEntry.preferred}" is in child avoid list`,
      );
    }
  }

  return conflicts;
}

/**
 * TRANSFORM: Generate a stable segment ID from chapter and position.
 */
export function generateSegmentId(chapter: string, position: number): string {
  const paddedPosition = String(position).padStart(4, '0');
  const safeChapter = chapter.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `${safeChapter}.s${paddedPosition}`;
}

/**
 * TRANSFORM: Apply a memory status transition.
 * Returns new status or throws if invalid transition.
 */
export type MemoryStatus = 'suggested' | 'accepted' | 'rejected' | 'superseded';

const VALID_TRANSITIONS: Record<MemoryStatus, MemoryStatus[]> = {
  suggested: ['accepted', 'rejected'],
  accepted: ['superseded'],
  rejected: [],
  superseded: [],
};

export function applyMemoryStatusTransition(
  current: MemoryStatus,
  next: MemoryStatus,
): MemoryStatus {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid memory transition: ${current} → ${next}`);
  }
  return next;
}
