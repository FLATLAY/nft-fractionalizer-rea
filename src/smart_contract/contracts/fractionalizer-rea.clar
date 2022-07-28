(define-constant contract-owner tx-sender)

(define-fungible-token fractions)
(define-non-fungible-token fractional-nft uint)

(define-map balances 
  {
    id: uint,
    owner: principal
  }
  uint
)

(define-map properties
  uint
  {
    price: uint,
    data: (string-ascii 256)
  }
)

(define-map listed
  {
    id: uint,
    owner: principal
  }
  uint
)

(define-map supplies uint uint)

(define-map uris uint (string-ascii 256))

(define-data-var identifier uint u0)

(define-constant err-contract-owner-only (err u100))
(define-constant err-unauthorized (err u101))
(define-constant err-nft-owner-only (err u102))
(define-constant err-unallowed-recipient (err u103))

(define-constant err-insufficient-balance (err u200))

(define-constant err-invalid-supply-value (err u300))

(define-constant err-unknown-nft-owner (err u400))
(define-constant err-unknown-nft-uri (err u401))
(define-constant err-unverified-nft-contract (err u403))

(define-constant err-zero-price (err u500))
(define-constant err-zero-fractions (err u501))
(define-constant err-invalid-fractions-value (err u502))

(define-constant err-not-listed (err u601))
(define-constant err-no-fractions-to-list (err u602))
(define-constant err-already-listed (err u603))

(define-constant err-property-not-found (err u700))

(define-read-only (get-balance (id uint) (who principal))
  (ok (default-to u0 (map-get? balances
    {
      id: id,
      owner: who
    }
  )))
)

(define-read-only (get-listed (id uint) (who principal))
  (ok (default-to u0 (map-get? listed
    {
      id: id,
      owner: who
    }
  )))
)

(define-read-only (get-overall-balance (who principal))
  (ok (ft-get-balance fractions who))
)

(define-read-only (get-overall-supply) 
  (ok (ft-get-supply fractions))
)

(define-read-only (get-total-supply (id uint)) 
  (ok (default-to u0 (map-get? supplies id)))
)

(define-read-only (get-total-supply-default-u1 (id uint)) 
  (ok (default-to u1 (map-get? supplies id)))
)

(define-read-only (get-token-uri (id uint)) 
  (ok (default-to none (some (map-get? uris id))))
)

(define-read-only (get-decimals (id uint)) 
  (ok u0)
)

(define-read-only (get-property (id uint))
  (ok (default-to { data: "", price: u0 } (map-get? properties id)))
)

(define-private (set-property (id uint) (property { price: uint, data: (string-ascii 256) }) (recipient principal))
  (begin
    (map-set properties id property)
    (ok id)
  )
)

(define-private 
  (transfer 
    (id uint) 
    (amount uint) 
    (sender principal)
    (recipient principal)
  )
  (let 
    (
      (senderBalance (unwrap-panic (get-balance id sender)))
      (recipientBalance (unwrap-panic (get-balance id recipient)))
    )
    (asserts! (not (is-eq sender recipient)) err-unallowed-recipient)
    (asserts! (<= amount senderBalance) err-insufficient-balance)
    (try! (ft-transfer? fractions amount sender recipient))
    (map-set balances { id: id, owner: sender } (- senderBalance amount))
    (map-set balances { id: id, owner: recipient } (+ recipientBalance amount))
    (print 
      {
        type: "sft_transfer",
        token-id: id,
        amount: amount,
        sender: sender,
        recipient: recipient
      }
    )
    (ok true)
  )
)

(define-private 
  (transfer-memo
    (id uint) 
    (amount uint) 
    (sender principal)
    (recipient principal)
    (memo (buff 34))
  )
  (begin
    (try! (transfer id amount sender recipient))
    (print memo)
    (ok true)
  )
)

(define-private (mint (recipient principal) (supply uint) (uri (string-ascii 256))) 
  (let 
    (
      (nft-id (+ (var-get identifier) u1))
    )
    (asserts! (> supply u0) err-invalid-supply-value)
    (try! (ft-mint? fractions supply recipient))
    (try! (nft-mint? fractional-nft nft-id (as-contract tx-sender)))
    (map-set supplies nft-id supply)
    (map-set balances { id: nft-id, owner: recipient } supply)
    (map-set uris nft-id uri)
    (print 
      {
        type: "sft_mint",
        token-id: nft-id,
        amount: supply,
        recipient: recipient
      }
    )
    (var-set identifier nft-id)
    (ok nft-id)
  )
)

(define-private (retract (id uint) (recipient principal)) 
  (let 
    (
      (balance (unwrap-panic (get-balance id recipient)))
      (supply (unwrap-panic (get-total-supply id)))
    )
    (asserts! (is-eq tx-sender recipient) err-unauthorized)
    (asserts! (is-eq balance supply) err-insufficient-balance)
    (as-contract (try! (nft-transfer? fractional-nft id tx-sender recipient)))
    (try! (ft-burn? fractions balance recipient))
    (map-delete balances { id: id, owner: recipient })
    (map-delete supplies id)
    (print 
      {
        type: "sft_burn",
        token-id: id,
        amount: balance,
        sender: recipient
      }
    )
    (ok true)
  )
)

(define-private (pvmint (recipient principal) (fractions_ uint) (uri (string-ascii 256)))
  (mint recipient fractions_ uri)
)

(define-public (submit-property (price uint) (fractions_ uint) (data (string-ascii 256)) (uri (string-ascii 256)))
  (let 
    (
      (recipient tx-sender)
    )
    (asserts! (> price u0) err-zero-price)
    (asserts! (> fractions_ u0) err-zero-fractions)
    (match (pvmint recipient fractions_ uri)
      token-id (set-property token-id { price: price, data: data } recipient) 
      err-value (err err-value)
    )
  )
)

(define-public (list-fractions (id uint) (fractions_ uint))
  (let
    (
      (owner tx-sender)
      (fractions-count (unwrap-panic (get-balance id tx-sender)))
      (listed-count (unwrap-panic (get-listed id tx-sender)))
    )
    (asserts! (> fractions-count u0) err-no-fractions-to-list)
    (asserts! (is-eq listed-count u0) err-already-listed)
    (asserts! (and (> fractions_ u0) (<= fractions_ fractions-count)) err-invalid-fractions-value)
    (try! (as-contract (transfer id fractions_ owner (as-contract tx-sender))))
    (map-set listed { owner: tx-sender, id: id } fractions_)
    (map-set balances { owner: tx-sender, id: id } (- fractions-count fractions_))
    (ok true)
  )
)

(define-public (unlist-fractions (id uint))
  (let
    (
      (owner tx-sender)
      (listed-count (unwrap-panic (get-listed id tx-sender)))
    )
    (asserts! (not (is-eq listed-count u0)) err-not-listed)
    (try! (as-contract (transfer id listed-count (as-contract tx-sender) owner)))
    (map-set listed { owner: tx-sender, id: id } u0)
    (map-set balances { owner: tx-sender, id: id } (+ (unwrap-panic (get-balance id tx-sender)) listed-count))
    (ok true)
  )
)

(define-public (purchase-fractions (id uint) (fractions_ uint) (seller principal))
  (let
    (
      (buyer tx-sender)
      (property (unwrap-panic (get-property id))) 
      (fraction-price (/ (get price property) (unwrap-panic (get-total-supply-default-u1 id))))
      (listed-count (unwrap-panic (get-listed id seller)))
    )
    (asserts! (not (is-eq listed-count u0)) err-not-listed)
    (asserts! (not (is-eq fraction-price u0)) err-property-not-found)
    (asserts! (and (<= fractions_ listed-count) (> fractions_ u0)) err-invalid-fractions-value)
    (try! (stx-transfer? (* (* fractions_ fraction-price) u1000000) buyer seller))
    (try! (as-contract (transfer id fractions_ tx-sender (as-contract buyer))))
    (map-set listed { owner: seller, id: id } (- listed-count fractions_))
    (ok true)
  )
)