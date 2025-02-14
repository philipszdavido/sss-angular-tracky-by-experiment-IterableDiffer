import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SSSRenderedBranchService {
  private renderedBranches = new Set<string>();

  getRenderedBranches(): string[] {
    return Array.from(this.renderedBranches);
  }

  isBranchRendered(branchId: string): boolean {
    return this.renderedBranches.has(branchId);
  }

  markBranchAsRendered(branchId: string): void {
    this.renderedBranches.add(branchId);
  }

  unmarkBranchAsRendered(branchId: string): void {
    this.renderedBranches.delete(branchId);
  }
}
