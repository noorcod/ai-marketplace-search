export const WISHLIST_POPULATE = {
  listing: {
    item: true,
    shop: true,
    listingPrice: true,
    location: {
      city: true,
    },
  },
};

export const RESERVATIONS_POPULATE = {
  listing: {
    images: true,
    listingPrice: true,
    item: true,
    shop: {
      shopOption: true,
    },
    location: {
      city: true,
    },
  },
};

export const LISTING_POPULATE = {
  shop: true,
  listingPrice: true,
  item: true,
  location: {
    city: true,
  },
};
export const RELATED_LISTINGS_POPULATE = {
  listingSpecification: true,
  listingPrice: true,
  item: true,
  shop: true,
  location: {
    city: true,
  },
};
export const PDP_POPULATE = {
  images: true,
  listingSpecification: true,
  listingPrice: true,
  listingText: true,
  listingMetadata: true,
  devicePorts: true,
  item: true,
  shop: {
    shopOption: true,
  },
  location: {
    city: true,
  },
};

export const FEATURED_LISTING_POPULATE = {
  displayLocation: true,
  listing: {
    item: true,
    listingPrice: true,
    shop: true,
    location: {
      city: true,
    },
  },
};

export const LEGACY_ORDER_POPULATE = {
  customer: true,
  listing: {
    reviews: true,
    item: true,
    shop: true,
    location: {
      city: true,
    },
  },
};

export const LISTING_REVIEWS_POPULATE = {
  listing: {
    item: true,
  },
  user: true,
  order: true,
};

export const CART_POPULATE = {
  cartItems: {
    item: true,
    shop: true,
    listing: {
      listingPrice: true,
    },
    location: {
      city: true,
    },
  },
};

export const USER_ADDRESSES_POPULATE = {
  user: true,
  tag: true,
};

export const ORDER_POPULATE = {
  user: true,
  orderSources: {
    orderItems: {
      listing: true,
    },
    shop: true,
    location: true,
    voucher: true,
  },
  deliveryAddresses: true,
  orderPayment: true,
};

export const VOUCHER_POPULATE = {
  conditions: true,
};
