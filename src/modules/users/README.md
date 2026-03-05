# Important Updates

Currently, we have `auth` table which includes the user information for marketplace. The `auth` table is referenced in 8 different tables as shown below.

* d4u_order
* listing_feedback
* listing_feedback_response
* listing_views
* reservations
* user_events
* user_searches
* user_wishlist

We'll be renaming the table to `marketplace_user` to better manage the user information, and also improve the structure.
```sql
RENAME TABLE auth TO marketplace_user;
```

