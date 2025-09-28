export const PAGE_PERMS = {
  DASHBOARD: {
    anyOf: [
      { object: "DASH_BROAD_ALL", action: "LIST" },
      { object: "DASH_BROAD_COMPANY", action: "LIST" },
      { object: "DASH_BROAD_BRANCH", action: "LIST" },
    ],
  },
  ORDERS: {
    anyOf: [
      { object: "ORDER_ALL", action: "LIST" },
      { object: "ORDER_COMPANY", action: "LIST" },
      { object: "ORDER_BRANCH", action: "LIST" },
    ],
  },
  BRANCHES: {
    anyOf: [
      { object: "BRANCH_ALL", action: "LIST" },
      { object: "BRANCH_COMPANY", action: "LIST" },
      { object: "BRANCH_BRANCH", action: "LIST" },
    ],
  },
  USERS: {
    anyOf: [
      { object: "USERS_ALL", action: "LIST" },
      { object: "USERS_COMPANY", action: "LIST" },
      { object: "USERS_BRANCH", action: "LIST" },
    ],
  },
} as const;
