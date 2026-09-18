const BASE_URL = "/seller";

const GET = {
  LIST: BASE_URL,
};

const POST = {
  LOGIN: `${BASE_URL}/login`,
  REGISTER: `${BASE_URL}/register`,
};

export const SellerRoutes = { GET, POST };
