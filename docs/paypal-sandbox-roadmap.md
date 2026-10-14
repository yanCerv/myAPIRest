# PayPal Sandbox Integration Roadmap

## Current status

PayPal is intentionally **not active** in the application payment-method catalogue. The card sandbox remains the only enabled checkout method.

The following groundwork is complete:

- A PayPal sandbox REST application was selected and its credentials are stored only in the local API `.env` file.
- TicketSeller includes the official `paypal-ios` Swift Package Manager dependency and a dedicated `PaypalRequest` integration boundary.
- The API database includes `OrderSession` and `SeatHold` models. A pending session holds selected seats for ten minutes; expired holds are released before a new reservation is created.
- The seat map treats an active hold as unavailable, so a pending checkout does not appear selectable to another buyer.

No PayPal order is created or captured yet, and no PayPal credential is committed to source control.

## Security boundaries

- `PAYPAL_CLIENT_SECRET` remains exclusively on MyAPIRest. It must never be added to TicketSeller, Info.plist, a committed configuration file, logs, or screenshots.
- TicketSeller may use the sandbox Client ID and Merchant ID to initialize the official SDK. They are identifiers, not server credentials.
- The client must never decide prices, payment completion, or seat ownership. MyAPIRest will calculate the total, create and capture the PayPal order, and create the ticket only after a verified capture.
- An order session is temporary. Cancellation, expiration, or a payment-provider failure must release its holds.
- The capture endpoint must be idempotent and verify the PayPal order ID, amount, currency, and completion status against the stored order session.

## Remaining prerequisites

Before enabling PayPal in `GET /api/v1/payment-methods`, configure:

1. A HTTPS domain owned by the project.
2. Apple Universal Links for TicketSeller, including the `apple-app-site-association` file on that domain.
3. A custom URL-scheme fallback for a failed Universal Link return.
4. The Apple Developer Program / app capabilities required to sign and test Associated Domains.

`localhost` cannot provide the Universal Link return used by the PayPal iOS SDK.

## Planned implementation

1. `POST /api/v1/purchases/paypal/orders` reserves seats and creates a PayPal Orders v2 order server-to-server.
2. TicketSeller creates a PayPal SDK session, passes the server-issued order ID to the SDK, and handles approval, cancellation, and failure.
3. `POST /api/v1/purchases/paypal/orders/{orderId}/capture` captures and verifies the PayPal order server-side.
4. In one transaction, MyAPIRest converts the held seats into a confirmed purchase, creates the ticket snapshot, and removes the seat holds.
5. Webhooks and reconciliation are added before production to handle delayed or out-of-app payment state changes.

## Local environment variables

The local `.env` uses the following names. Values are deliberately omitted from this document and from `.env.example`.

```env
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MERCHANT_ID=
```
