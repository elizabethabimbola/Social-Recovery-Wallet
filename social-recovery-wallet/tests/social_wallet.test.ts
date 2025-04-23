import { describe, expect, it } from "vitest";

// Mock implementation of the Clarity contract functionality
class SocialRecoveryWallet {
  private owner: string = "";
  private guardians: Map<string, boolean> = new Map();
  private guardianThreshold: number = 0;
  private guardianCount: number = 0;
  private recoveryNonce: number = 0;
  private walletOwners: Map<string, boolean> = new Map();
  private recoveryVotes: Map<string, boolean> = new Map();
  private recoveryStatus: Map<number, {
    initiator: string,
    proposedOwner: string,
    voteCount: number,
    threshold: number,
    active: boolean,
    completed: boolean
  }> = new Map();
  private currentSender: string = "";

  // Constants for error codes
  private readonly ERR_UNAUTHORIZED = { err: 1 };
  private readonly ERR_INVALID_THRESHOLD = { err: 2 };
  private readonly ERR_ALREADY_VOTED = { err: 3 };
  private readonly ERR_RECOVERY_NOT_ACTIVE = { err: 4 };
  private readonly ERR_INVALID_GUARDIAN = { err: 5 };
  private readonly ERR_RECOVERY_IN_PROGRESS = { err: 6 };
  private readonly ERR_RECOVERY_COMPLETED = { err: 7 };
  private readonly ERR_THRESHOLD_NOT_MET = { err: 8 };
  
  // Helper to set tx sender for testing
  setSender(address: string) {
    this.currentSender = address;
  }
  
  // Initialize wallet
  initialize(newOwner: string, threshold: number) {
    if (this.owner !== "") {
      return this.ERR_UNAUTHORIZED;
    }
    
    this.owner = newOwner;
    this.guardianThreshold = threshold;
    this.walletOwners.set(newOwner, true);
    
    return { ok: true };
  }
  
  // Check owner
  private checkOwner() {
    if (this.walletOwners.get(this.currentSender) !== true) {
      return this.ERR_UNAUTHORIZED;
    }
    return { ok: true };
  }
  
  // Add guardian
  addGuardian(guardian: string) {
    const ownerCheck = this.checkOwner();
    if ('err' in ownerCheck) {
      return ownerCheck;
    }
    
    if (this.guardians.get(guardian) === true) {
      return this.ERR_UNAUTHORIZED;
    }
    
    this.guardians.set(guardian, true);
    this.guardianCount++;
    
    return { ok: true };
  }
  
  // Remove guardian
  removeGuardian(guardian: string) {
    const ownerCheck = this.checkOwner();
    if ('err' in ownerCheck) {
      return ownerCheck;
    }
    
    if (this.guardians.get(guardian) !== true) {
      return this.ERR_INVALID_GUARDIAN;
    }
    
    this.guardians.delete(guardian);
    this.guardianCount--;
    
    if (this.guardianThreshold > this.guardianCount) {
      return this.ERR_INVALID_THRESHOLD;
    }
    
    return { ok: true };
  }
  
  // Update threshold
  updateThreshold(newThreshold: number) {
    const ownerCheck = this.checkOwner();
    if ('err' in ownerCheck) {
      return ownerCheck;
    }
    
    if (newThreshold > this.guardianCount || newThreshold <= 0) {
      return this.ERR_INVALID_THRESHOLD;
    }
    
    this.guardianThreshold = newThreshold;
    return { ok: true };
  }
  
  // Initiate recovery
  initiateRecovery(newOwner: string) {
    if (this.guardians.get(this.currentSender) !== true) {
      return this.ERR_INVALID_GUARDIAN;
    }
    
    const recoveryId = this.recoveryNonce;
    
    this.recoveryStatus.set(recoveryId, {
      initiator: this.currentSender,
      proposedOwner: newOwner,
      voteCount: 1,
      threshold: this.guardianThreshold,
      active: true,
      completed: false
    });
    
    const voteKey = `${recoveryId}-${this.currentSender}`;
    this.recoveryVotes.set(voteKey, true);
    
    this.recoveryNonce++;
    
    return { ok: recoveryId };
  }
  
  // Support recovery
  supportRecovery(recoveryId: number) {
    const recovery = this.recoveryStatus.get(recoveryId);
    
    if (!recovery || !recovery.active) {
      return this.ERR_RECOVERY_NOT_ACTIVE;
    }
    
    if (recovery.completed) {
      return this.ERR_RECOVERY_COMPLETED;
    }
    
    if (this.guardians.get(this.currentSender) !== true) {
      return this.ERR_INVALID_GUARDIAN;
    }
    
    const voteKey = `${recoveryId}-${this.currentSender}`;
    if (this.recoveryVotes.get(voteKey) === true) {
      return this.ERR_ALREADY_VOTED;
    }
    
    this.recoveryVotes.set(voteKey, true);
    
    recovery.voteCount++;
    this.recoveryStatus.set(recoveryId, recovery);
    
    return { ok: true };
  }
  
  // Execute recovery
  executeRecovery(recoveryId: number) {
    const recovery = this.recoveryStatus.get(recoveryId);
    
    if (!recovery || !recovery.active) {
      return this.ERR_RECOVERY_NOT_ACTIVE;
    }
    
    if (recovery.completed) {
      return this.ERR_RECOVERY_COMPLETED;
    }
    
    if (recovery.voteCount < recovery.threshold) {
      return this.ERR_THRESHOLD_NOT_MET;
    }
    
    recovery.active = false;
    recovery.completed = true;
    this.recoveryStatus.set(recoveryId, recovery);
    
    const oldOwner = this.owner;
    const newOwner = recovery.proposedOwner;
    
    this.walletOwners.delete(oldOwner);
    this.owner = newOwner;
    this.walletOwners.set(newOwner, true);
    
    return { ok: true };
  }
  
  // Cancel recovery
  cancelRecovery(recoveryId: number) {
    const ownerCheck = this.checkOwner();
    if ('err' in ownerCheck) {
      return ownerCheck;
    }
    
    const recovery = this.recoveryStatus.get(recoveryId);
    
    if (!recovery || !recovery.active) {
      return this.ERR_RECOVERY_NOT_ACTIVE;
    }
    
    if (recovery.completed) {
      return this.ERR_RECOVERY_COMPLETED;
    }
    
    recovery.active = false;
    this.recoveryStatus.set(recoveryId, recovery);
    
    return { ok: true };
  }
  
  // Read-only functions
  getOwner() {
    return this.owner;
  }
  
  getThreshold() {
    return this.guardianThreshold;
  }
  
  isGuardian(address: string) {
    return this.guardians.get(address) === true;
  }
  
  getRecoveryStatus(recoveryId: number) {
    return this.recoveryStatus.get(recoveryId);
  }
  
  hasVoted(recoveryId: number, guardian: string) {
    const voteKey = `${recoveryId}-${guardian}`;
    return this.recoveryVotes.get(voteKey) === true;
  }
  
  getGuardianCount() {
    return this.guardianCount;
  }
}

describe("Social Recovery Wallet Tests", () => {
  describe("Initialization", () => {
    it("should initialize wallet with owner and threshold", () => {
      const wallet = new SocialRecoveryWallet();
      const result = wallet.initialize("owner-address", 2);
      
      expect(result).toEqual({ ok: true });
      expect(wallet.getOwner()).toBe("owner-address");
      expect(wallet.getThreshold()).toBe(2);
    });
    
    it("should not allow initializing twice", () => {
      const wallet = new SocialRecoveryWallet();
      wallet.initialize("owner-address", 2);
      const result = wallet.initialize("another-address", 3);
      
      expect(result).toEqual({ err: 1 }); // ERR_UNAUTHORIZED
      expect(wallet.getOwner()).toBe("owner-address"); // Original owner remains
    });
  });

  describe("Guardian Management", () => {
    it("should allow owner to add guardians", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      
      const result = wallet.addGuardian("guardian1");
      
      expect(result).toEqual({ ok: true });
      expect(wallet.isGuardian("guardian1")).toBe(true);
      expect(wallet.getGuardianCount()).toBe(1);
    });
    
    it("should not allow non-owners to add guardians", () => {
      const wallet = new SocialRecoveryWallet();
      wallet.initialize("owner-address", 2);
      wallet.setSender("non-owner");
      
      const result = wallet.addGuardian("guardian1");
      
      expect(result).toEqual({ err: 1 }); // ERR_UNAUTHORIZED
      expect(wallet.isGuardian("guardian1")).toBe(false);
    });
    
    it("should allow owner to remove guardians", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      wallet.initialize(ownerAddress, 1);
      wallet.setSender(ownerAddress);
      
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      
      const result = wallet.removeGuardian("guardian1");
      
      expect(result).toEqual({ ok: true });
      expect(wallet.isGuardian("guardian1")).toBe(false);
      expect(wallet.isGuardian("guardian2")).toBe(true);
      expect(wallet.getGuardianCount()).toBe(1);
    });
    
    it("should not allow removing guardians if threshold would become invalid", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      
      // Removing guardian would make threshold (2) > guardian count (1)
      const result = wallet.removeGuardian("guardian1");
      
      expect(result).toEqual({ err: 2 }); // ERR_INVALID_THRESHOLD
      expect(wallet.isGuardian("guardian1")).toBe(true); // Guardian not removed
    });
    
    it("should allow owner to update threshold", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      wallet.initialize(ownerAddress, 1);
      wallet.setSender(ownerAddress);
      
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      wallet.addGuardian("guardian3");
      
      const result = wallet.updateThreshold(2);
      
      expect(result).toEqual({ ok: true });
      expect(wallet.getThreshold()).toBe(2);
    });
    
    it("should not allow threshold greater than guardian count", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      wallet.initialize(ownerAddress, 1);
      wallet.setSender(ownerAddress);
      
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      
      const result = wallet.updateThreshold(3); // Only 2 guardians exist
      
      expect(result).toEqual({ err: 2 }); // ERR_INVALID_THRESHOLD
      expect(wallet.getThreshold()).toBe(1); // Threshold unchanged
    });
  });

  describe("Recovery Process", () => {
    it("should allow a guardian to initiate recovery", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      const guardianAddress = "guardian1";
      
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      wallet.addGuardian(guardianAddress);
      wallet.addGuardian("guardian2");
      wallet.addGuardian("guardian3");
      
      wallet.setSender(guardianAddress);
      const result = wallet.initiateRecovery("new-owner");
      
      expect(result).toEqual({ ok: 0 }); // First recovery ID should be 0
      
      const recoveryStatus = wallet.getRecoveryStatus(0);
      expect(recoveryStatus).toBeDefined();
      expect(recoveryStatus?.initiator).toBe(guardianAddress);
      expect(recoveryStatus?.proposedOwner).toBe("new-owner");
      expect(recoveryStatus?.voteCount).toBe(1);
      expect(recoveryStatus?.active).toBe(true);
    });
    
    it("should allow guardians to support recovery", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      
      // Initiate recovery
      wallet.setSender("guardian1");
      const initResult = wallet.initiateRecovery("new-owner");
      const recoveryId = (initResult as { ok: number }).ok;
      
      // Second guardian supports recovery
      wallet.setSender("guardian2");
      const supportResult = wallet.supportRecovery(recoveryId);
      
      expect(supportResult).toEqual({ ok: true });
      
      const recoveryStatus = wallet.getRecoveryStatus(recoveryId);
      expect(recoveryStatus?.voteCount).toBe(2);
    });
    
    it("should not allow a guardian to vote twice", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      const guardianAddress = "guardian1";
      
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      wallet.addGuardian(guardianAddress);
      wallet.addGuardian("guardian2");
      
      // Initiate recovery (counts as a vote)
      wallet.setSender(guardianAddress);
      const initResult = wallet.initiateRecovery("new-owner");
      const recoveryId = (initResult as { ok: number }).ok;
      
      // Try to vote again
      const supportResult = wallet.supportRecovery(recoveryId);
      
      expect(supportResult).toEqual({ err: 3 }); // ERR_ALREADY_VOTED
    });
    
    it("should execute recovery when threshold is met", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      wallet.addGuardian("guardian3");
      
      // Initiate recovery
      wallet.setSender("guardian1");
      const initResult = wallet.initiateRecovery("new-owner");
      const recoveryId = (initResult as { ok: number }).ok;
      
      // Second guardian supports recovery
      wallet.setSender("guardian2");
      wallet.supportRecovery(recoveryId);
      
      // Execute recovery
      const executeResult = wallet.executeRecovery(recoveryId);
      
      expect(executeResult).toEqual({ ok: true });
      expect(wallet.getOwner()).toBe("new-owner");
      
      const recoveryStatus = wallet.getRecoveryStatus(recoveryId);
      expect(recoveryStatus?.completed).toBe(true);
      expect(recoveryStatus?.active).toBe(false);
    });
    
    it("should not execute recovery when threshold is not met", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      
      wallet.initialize(ownerAddress, 3);
      wallet.setSender(ownerAddress);
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      wallet.addGuardian("guardian3");
      
      // Initiate recovery
      wallet.setSender("guardian1");
      const initResult = wallet.initiateRecovery("new-owner");
      const recoveryId = (initResult as { ok: number }).ok;
      
      // Second guardian supports recovery
      wallet.setSender("guardian2");
      wallet.supportRecovery(recoveryId);
      
      // Try to execute with only 2 votes (threshold is 3)
      const executeResult = wallet.executeRecovery(recoveryId);
      
      expect(executeResult).toEqual({ err: 8 }); // ERR_THRESHOLD_NOT_MET
      expect(wallet.getOwner()).toBe(ownerAddress); // Owner unchanged
    });
    
    it("should allow owner to cancel recovery", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      
      // Initiate recovery
      wallet.setSender("guardian1");
      const initResult = wallet.initiateRecovery("new-owner");
      const recoveryId = (initResult as { ok: number }).ok;
      
      // Owner cancels recovery
      wallet.setSender(ownerAddress);
      const cancelResult = wallet.cancelRecovery(recoveryId);
      
      expect(cancelResult).toEqual({ ok: true });
      
      const recoveryStatus = wallet.getRecoveryStatus(recoveryId);
      expect(recoveryStatus?.active).toBe(false);
    });
    
    it("should not allow non-owner to cancel recovery", () => {
      const wallet = new SocialRecoveryWallet();
      const ownerAddress = "owner-address";
      
      wallet.initialize(ownerAddress, 2);
      wallet.setSender(ownerAddress);
      wallet.addGuardian("guardian1");
      wallet.addGuardian("guardian2");
      
      // Initiate recovery
      wallet.setSender("guardian1");
      const initResult = wallet.initiateRecovery("new-owner");
      const recoveryId = (initResult as { ok: number }).ok;
      
      // Non-owner tries to cancel recovery
      wallet.setSender("random-address");
      const cancelResult = wallet.cancelRecovery(recoveryId);
      
      expect(cancelResult).toEqual({ err: 1 }); // ERR_UNAUTHORIZED
      
      const recoveryStatus = wallet.getRecoveryStatus(recoveryId);
      expect(recoveryStatus?.active).toBe(true); // Recovery still active
    });
  });
});