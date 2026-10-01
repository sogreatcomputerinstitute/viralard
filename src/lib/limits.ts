export const FREE_MONTHLY_LIMIT = 5;

/**
 * Fair-use ceiling for Pro. The product is sold as "unlimited", which it is for
 * every realistic user, but an uncapped endpoint is an open tab on the Gemini
 * bill if one account starts scripting. Raised quietly rather than surfaced in
 * the UI, and revisit once you have real usage data.
 */
export const PRO_FAIR_USE_LIMIT = 500;

export const CREDITS_PER_PACK = 50;

export const RATE_LIMIT_PER_HOUR = 20;