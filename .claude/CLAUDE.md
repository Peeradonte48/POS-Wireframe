# High-Level User Flow
*Use this as a blueprint for designing the POS system.*

## 1. Pre-Dining Phase (Queue & Table Management)
- Customer: Walks to the kiosk at the storefront to get a queue ticket and waits in the designated area for their number to be called.

- Staff (on POS): Monitors real-time table occupancy via the Digital Floor Plan interface.

- Staff (on POS): Selects an available table to "Open Table" and inputs the number of guests to initiate session tracking and occupancy analytics.

## 2. Ordering Phase (The "Exam Paper" System)
- Customer: Fills out two "Exam Paper" forms (the Main Menu and the Customization sheet) to specify their preferences.

- Customer: Presses the table call bell (a standalone system independent of the POS).

- Staff (on POS): Collects the forms at the table, verifies the selections, and performs a read-back to ensure accuracy.

- Staff (on POS): Inputs data into the POS using Forced Modifiers (mandatory selections such as spiciness level and noodle texture) to ensure the digital order matches the physical form perfectly.

- Staff (on POS): Confirms the order; the system triggers automatic inventory depletion and instantly transmits the order to the Kitchen Display System (KDS) or printer.

## 3. Receiving Phase (Service & Fulfillment)
- Customer: Waits for and receives the meal served through the service hatch directly in front of their seat.

- Staff (on POS): Tracks order status by manually checking the service counter (in the absence of a Digital Order Tracking system).

- Staff (on POS): Once the meal is served and the invoice is placed, the staff taps "Served" on the tablet to log the actual service start time for operational KPIs.

## 4. Payment Phase (Integrated Checkout)
- Customer: Proceeds to the counter, provides the table number, and presents a discount QR code from their mobile app.

- Staff (on POS): Locates the table on the POS and uses the tablet’s rear camera to scan the coupon directly within the POS app, eliminating the need to switch apps or manually input codes.

- Staff (on POS): The system calculates the discount automatically and displays a Dynamic QR Code on the tablet screen, allowing the customer to "Scan to Pay" the net amount instantly.

## 5. Loyalty Phase (Member Points Accumulation)
###5.1 Scenario A: Standalone / Manual Loyalty (No CRM Integration)
In this model, the POS and Loyalty systems are siloed. Data does not flow between them.

- Customer: Verifies the payment amount and receives a physical receipt.

- Staff (on POS): The system prints a receipt containing a static QR code (a simple URL link).

- Customer: Scans the QR code to open a separate web portal or app.

- Customer: Must manually input additional details (e.g., phone number or receipt ID) to verify the transaction and claim points.

- System Gap: Member data is not visible to staff on the POS, preventing personalized greetings or targeted upselling based on member status.

### 5.2 Scenario B: Integrated CRM (Smart Loyalty)
- In this model, the POS and CRM are unified, creating a frictionless data flow.

- Customer: Verifies the payment amount and receives the receipt.

- Staff (on POS): The POS displays member insights (e.g., Tier level, current points) to the staff during the checkout process.

- Staff (on POS): The system prints a receipt with a Unique Dynamic QR Code that already contains the transaction value, branch ID, and timestamp.

- Customer: Scans the QR code once with their smartphone.

- System: Points are credited instantly because the QR code is already linked to the specific transaction and member profile—no manual data entry required.

- System: Sends an automated Push Notification thanking the customer and updating them on their new points balance immediately after the scan.