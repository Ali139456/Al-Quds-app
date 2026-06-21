# Al-Quds Backend (localhost)

Node + Express + SQLite backend for the Al-Quds food app. Uses **sql.js** (no native compilation), so it runs on any Node version. Use it to view orders in the admin, inspect the database, and (optionally) connect the mobile app to a real API.

## Quick start

```bash
cd backend
npm install
npm start
```

- **API base:** http://localhost:4000  
- **Admin panel:** http://localhost:4000/admin  
- **Database file:** `backend/data/alquds.db`

## Admin page

1. Open **http://localhost:4000/admin**
2. Login:
   - **Email:** `admin@alquds.local`
   - **Password:** `admin123`
3. You can:
   - See stats (orders, users, menu items)
   - List all orders and change status (placed → confirmed → preparing → out_for_delivery → delivered)
   - List registered users

## Accessing the database

The SQLite file is at:

```
FoodOrderApp/backend/data/alquds.db
```

### Option 1: Command line (sqlite3)

If you have `sqlite3` installed:

```bash
cd backend
sqlite3 data/alquds.db
```

Then run SQL, e.g.:

```sql
.tables
SELECT * FROM orders;
SELECT * FROM menu_items LIMIT 5;
.quit
```

### Option 2: DB Browser for SQLite (GUI)

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the file: `FoodOrderApp/backend/data/alquds.db`
3. Browse tables: `users`, `admin_users`, `addresses`, `menu_items`, `orders`, `order_items`

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/menu | List all menu items |
| POST | /api/orders | Create order (body: userId, items, total, addressLabel, addressLine) |
| GET | /api/orders | List orders (optional ?userId=) |
| POST | /api/admin/login | Admin login (body: email, password) |
| GET | /api/admin/orders | List all orders (admin) |
| PATCH | /api/admin/orders/:id | Update order status (body: status) |
| GET | /api/admin/users | List users (admin) |
| GET | /api/admin/stats | Counts for orders, users, menu (admin) |

## Re-initialize the database

To reset tables and re-seed menu + default admin:

```bash
cd backend
npm run init-db
```

Then start the server again with `npm start`.

## Running the full app on localhost

1. **Backend:** In a terminal, run `cd backend && npm install && npm start`. Leave it running.
2. **Mobile app:** In another terminal, run `cd FoodOrderApp && npm start`. Use Expo Go or web.
3. **Admin:** In the browser, open http://localhost:4000/admin and log in.

Orders placed in the app are currently stored only on the device (AsyncStorage). To save them to this backend as well, the app would need to call `POST /api/orders` when the user places an order (and the backend would need to be reachable from the device, e.g. using your machine’s LAN IP instead of `localhost`).
