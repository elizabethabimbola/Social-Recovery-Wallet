
;; title: Social Recovery Wallet
;; version:
;; summary:
;; description: A wallet system that allows recovery of access through trusted guardians
;; using threshold signatures for recovery approval

;; Constants
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID_GUARDIAN (err u1001))
(define-constant ERR_GUARDIAN_EXISTS (err u1002))
(define-constant ERR_INSUFFICIENT_GUARDIANS (err u1003))
(define-constant ERR_NO_ACTIVE_RECOVERY (err u1004))
(define-constant ERR_ALREADY_APPROVED (err u1005))
(define-constant ERR_THRESHOLD_NOT_MET (err u1006))
(define-constant ERR_EXPIRED_REQUEST (err u1007))
(define-constant ERR_WAITING_PERIOD (err u1008))
(define-constant ERR_INVALID_THRESHOLD (err u1009))

;; Data Maps
(define-map wallet-owners (buff 20) bool)
(define-map guardians (buff 20) bool)
(define-map recovery-votes {recovery-id: uint, guardian: (buff 20)} bool)
(define-map recovery-status {recovery-id: uint} 
  {
    initiator: (buff 20),
    proposed-owner: (buff 20),
    vote-count: uint,
    threshold: uint,
    active: bool,
    completed: bool
  }
)

;; Data Variables
(define-data-var owner (buff 20) 0x)
(define-data-var guardian-threshold uint u0)
(define-data-var guardian-count uint u0)
(define-data-var recovery-nonce uint u0)
