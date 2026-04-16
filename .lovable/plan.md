
The user wants the page background gradient used on the **Take-In** page to be applied consistently across **every** page in the CRM (Dashboard, Inventory, Customers, Payouts, Analytics, Settings).

## Investigation

Take-In uses a fixed full-bleed layout. Other pages use `page-gradient` from `src/index.css` set on a fixed div in `JewelryPawnApp.tsx`. I need to confirm what gradient Take-In actually paints vs. what `.page-gradient` currently is, and align them.

Let me check the relevant files.
