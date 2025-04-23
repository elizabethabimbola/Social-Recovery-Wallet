
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


;; Initialize wallet
(define-public (initialize (new-owner (buff 20)) (threshold uint))
  (begin
    (asserts! (is-eq (var-get owner) 0x) ERR_UNAUTHORIZED)
    (var-set owner new-owner)
    (var-set guardian-threshold threshold)
    (map-set wallet-owners new-owner true)
    (ok true)))

;; Only owner can call
(define-private (check-owner)
  (ok (asserts! (default-to false (map-get? wallet-owners tx-sender)) ERR_UNAUTHORIZED)))


  ;; Add a guardian
(define-public (add-guardian (guardian (buff 20)))
  (begin
    (try! (check-owner))
    (asserts! (not (default-to false (map-get? guardians guardian))) ERR_UNAUTHORIZED)
    (map-set guardians guardian true)
    (var-set guardian-count (+ (var-get guardian-count) u1))
    (ok true)))

;; Remove a guardian
(define-public (remove-guardian (guardian (buff 20)))
  (begin
    (try! (check-owner))
    (asserts! (default-to false (map-get? guardians guardian)) ERR_INVALID_GUARDIAN)
    (map-delete guardians guardian)
    (var-set guardian-count (- (var-get guardian-count) u1))
    ;; Ensure threshold is still valid
    (asserts! (<= (var-get guardian-threshold) (var-get guardian-count)) ERR_INVALID_THRESHOLD)
    (ok true)))