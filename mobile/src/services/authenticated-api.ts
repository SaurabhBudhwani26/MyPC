// Authenticated API service for making requests that require JWT tokens
export class AuthenticatedApiService {
  private getAuthToken: (() => Promise<string | null>) | null = null;

  // Set the token getter function
  setTokenGetter(tokenGetter: () => Promise<string | null>) {
    this.getAuthToken = tokenGetter;
  }

  // Make authenticated fetch request
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken?.();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // PC Build Management with Authentication
  async createPCBuild(buildData: {
    name: string;
    description?: string;
    components?: Record<string, any>;
  }): Promise<{ success: boolean; build?: any; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const response = await this.authenticatedFetch(`${API_BASE_URL}/pc-builder/builds`, {
        method: 'POST',
        body: JSON.stringify(buildData),
      });

      console.log('📝 Response status:', response.status);
      const data = await response.json();
      console.log('📝 Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.log('❌ Response not OK:', response.status, data);
        return { success: false, message: data.message || 'Failed to create build' };
      }

      // Backend returns: { success: true, data: { build: {...} } }
      let build = data.data?.build || data.build || data.data;
      console.log('🏗️ Extracted build:', build);

      if (!build) {
        console.log('⚠️ No build found in response. Full response:', data);
        return { success: false, message: 'Build data not found in response' };
      }

      return { success: true, build };
    } catch (error) {
      console.error('Error creating PC build:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async updatePCBuild(buildId: string, updates: {
    name?: string;
    description?: string;
    components?: Record<string, any>;
  }): Promise<{ success: boolean; build?: any; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const response = await this.authenticatedFetch(`${API_BASE_URL}/pc-builder/builds/${buildId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to update build' };
      }

      return { success: true, build: data.data?.build || data.build };
    } catch (error) {
      console.error('Error updating PC build:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async addComponentToBuild(buildId: string, component: {
    category: string;
    componentId: string;
    component: any;
  }): Promise<{ success: boolean; build?: any; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const url = `${API_BASE_URL}/pc-builder/builds/${buildId}/components`;

      console.log('🚀 API Request: POST', url);
      console.log('📤 Request payload:', JSON.stringify(component, null, 2));

      const response = await this.authenticatedFetch(url, {
        method: 'POST',
        body: JSON.stringify(component),
      });

      console.log('📊 Response status:', response.status);

      const data = await response.json();
      console.log('📥 Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        return { success: false, message: data.message || 'Failed to add component' };
      }

      return { success: true, build: data.data?.build || data.build };
    } catch (error) {
      console.error('❌ Network error adding component to build:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async removeComponentFromBuild(buildId: string, category: string): Promise<{ success: boolean; build?: any; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const response = await this.authenticatedFetch(`${API_BASE_URL}/pc-builder/builds/${buildId}/components/${category}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to remove component' };
      }

      return { success: true, build: data.data?.build || data.build };
    } catch (error) {
      console.error('Error removing component from build:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async getUserBuilds(page: number = 1, limit: number = 10): Promise<{ success: boolean; builds?: any[]; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const response = await this.authenticatedFetch(`${API_BASE_URL}/pc-builder/builds?page=${page}&limit=${limit}`);

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to fetch builds' };
      }

      return { success: true, builds: data.data?.builds || data.builds };
    } catch (error) {
      console.error('Error fetching user builds:', error);
      return { success: false, message: 'Network error' };
    }
  }

  // Wishlist Management with Authentication
  async addToWishlist(componentId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const response = await this.authenticatedFetch(`${API_BASE_URL}/pc-builder/components/${componentId}/wishlist`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to add to wishlist' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async removeFromWishlist(componentId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const response = await this.authenticatedFetch(`${API_BASE_URL}/pc-builder/components/${componentId}/wishlist`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to remove from wishlist' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async getWishlist(): Promise<{ success: boolean; components?: any[]; message?: string }> {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.22:3001/api';
      const response = await this.authenticatedFetch(`${API_BASE_URL}/pc-builder/wishlist`);

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to fetch wishlist' };
      }

      return { success: true, components: data.components };
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { success: false, message: 'Network error' };
    }
  }
}

// Export singleton instance
export const authenticatedApi = new AuthenticatedApiService();
