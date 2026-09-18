const BASE_URL = "/seller";

const GET = {
  LIST: BASE_URL,
  ME: `${BASE_URL}/me`,
};

const POST = {
  LOGIN: `${BASE_URL}/login`,
  REGISTER: `${BASE_URL}/register`,
};

export const SellerRoutes = { GET, POST };
