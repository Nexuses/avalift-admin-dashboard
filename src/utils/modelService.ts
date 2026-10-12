import { ApiResponse, apiGetFetcher, apiPostFetcher } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

interface AddModelRequest {
  brand: string;
  model: string;
  brand_image: string;
}

interface ModelApiResponse {
  data: string[];
}

interface BrandWithModels {
  brand: string;
  models: string[];
  brand_image: string;
}

interface AllBrandsModelsApiResponse {
  data: BrandWithModels[];
}

interface FetchModelsResponse {
  brand: string;
  models: string[];
}

const ModelService = {
  fetchAllBrandsModels: async (): Promise<ApiResponse<{ data: AllBrandsModelsApiResponse[] }>> => {
    const url = `${BASE_URL}/api/vehicle/all-brands-models`;
    const token = localStorage.getItem("authToken");

    if (!token) {
      return {
        success: false,
        data: { data: [] },
        status: null,
        error: "Authentication token is missing.",
      };
    }

    try {
      const response: ApiResponse<{ data: AllBrandsModelsApiResponse[] }> = await apiGetFetcher(url, token);

      if (response.success && response.data) {
        return response;
      }

      return {
        success: false,
        data: { data: [] },
        status: response.status,
        error: response.error || "Failed to fetch all brands and models.",
      };
    } catch (error) {
      console.error("Error fetching all brands and models:", error);
      return {
        success: false,
        data: { data: [] },
        status: null,
        error: "An error occurred while fetching all brands and models.",
      };
    }
  },

  addModel: async (
    brand: string,
    model: string,
    brand_image: string,
    token: string
  ): Promise<ApiResponse<ModelApiResponse>> => {
    const url = `${BASE_URL}/api/vehicle/add-model`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication failed: Missing token. Please log in and try again.",
      };
    }

    if (!brand || !model) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Both brand and model fields are required.",
      };
    }

    const requestPayload: AddModelRequest = { brand, model, brand_image };

    try {
      const response: ApiResponse<ModelApiResponse> = await apiPostFetcher<ModelApiResponse>(
        url,
        requestPayload,
        token
      );

      if (!response.success) {
        return {
          success: false,
          data: null,
          status: response.status,
          error: response.error || "Failed to add model. Please try again.",
        };
      }

      return response;
    } catch (error: any) {
      console.error("Error adding model:", error);
      return {
        success: false,
        data: null,
        status: error?.response?.status || 500,
        error: error?.response?.data?.error ||
          error?.response?.data?.message ||
          "An unexpected error occurred while adding the model. Please try again later.",
      };
    }
  },

  fetchModels: async (brand: string): Promise<ApiResponse<{ models: string[] }>> => {
    const url = `${BASE_URL}/api/admin/vehicle/models/${brand}`;
    const token = localStorage.getItem("authToken");

    if (!token) {
      return {
        success: false,
        data: { models: [] },
        status: null,
        error: "Authentication token is missing.",
      };
    }

    try {
      const response: ApiResponse<{ data: FetchModelsResponse }> = await apiGetFetcher(url, token);

      if (response.success && response.data?.data?.models) {
        return {
          success: true,
          data: { models: response.data.data.models },
          status: response.status,
          error: null,
        };
      }

      return {
        success: false,
        data: { models: [] },
        status: response.status,
        error: response.error || "Failed to fetch models.",
      };
    } catch (error: any) {
      console.error("Error fetching models:", error);
      return {
        success: false,
        data: { models: [] },
        status: error?.response?.status || null,
        error: error?.message || "An error occurred while fetching models.",
      };
    }
  },
};

export default ModelService;