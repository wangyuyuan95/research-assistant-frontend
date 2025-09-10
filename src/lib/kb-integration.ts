// 知识库集成服务 - 符合RAGFlow实际接口规范
export interface KBAuthData {
  email: string;
  nickname: string;
  password: string;
}

export interface KBUserData {
  access_token: string;
  avatar?: string;
  email: string;
  nickname: string;
  id: string;
  create_date: string;
  create_time: number;
  is_superuser: boolean;
  status: string;
  login_channel: string;
  last_login_time: string;
}

export interface KBResponse {
  code: number;
  message: string;
  data: KBUserData | boolean;
}

export interface KBTokenData {
  token: string;
  beta: string;
  create_time: number;
  create_date: string;
  tenant_id: string;
  update_time?: number;
  update_date?: string;
}

export interface KBTokenResponse {
  code: number;
  message: string;
  data: KBTokenData[];
}

// 知识库参数工具函数
export const getDatasetIds = (): string[] => {
  try {
    const stored = localStorage.getItem('selected-knowledge-bases');
    if (!stored) {
      return [];
    }
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    
    return parsed.filter(id => typeof id === 'string' && id.trim().length > 0);
  } catch (error) {
    console.warn('Failed to parse selected knowledge bases:', error);
    return [];
  }
};

export const getKbApiKey = (): string | null => {
  try {
    const apiKey = localStorage.getItem('kb_api_key');
    if (!apiKey || apiKey.trim().length === 0) {
      return null;
    }
    return apiKey.trim();
  } catch (error) {
    console.warn('Failed to get kb_api_key:', error);
    return null;
  }
};

export const getKbUrl = (): string | null => {
  try {
    const kbUrl = process.env.NEXT_PUBLIC_KB_URL;
    if (!kbUrl || kbUrl.trim().length === 0) {
      return null;
    }
    return kbUrl.trim();
  } catch (error) {
    console.warn('Failed to get kb_url:', error);
    return null;
  }
};

export const getKnowledgeBaseParams = () => {
  return {
    dataset_ids: getDatasetIds(),
    kb_api_key: getKbApiKey(),
    kb_url: getKbUrl()
  };
};

export const hasAnyKnowledgeBaseParams = (): boolean => {
  const params = getKnowledgeBaseParams();
  return (
    params.dataset_ids.length > 0 ||
    params.kb_api_key !== null ||
    params.kb_url !== null
  );
};

export const hasCompleteKnowledgeBaseConfig = (): boolean => {
  const params = getKnowledgeBaseParams();
  return (
    params.dataset_ids.length > 0 &&
    params.kb_api_key !== null &&
    params.kb_url !== null
  );
};

// 发送显示数据到知识库iframe
export function sendKnowledgeBaseDisplayData() {
  const kbUrl = process.env.NEXT_PUBLIC_KB_URL;
  if (!kbUrl) return;

  try {
    const currentLanguage = localStorage.getItem("i18nextLng") || 'zh';
    
    let currentTheme = 'light';
    if (typeof window !== 'undefined') {
      // 优先使用localStorage中的主题设置
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        currentTheme = storedTheme;
      } else {
        // 如果localStorage没有，则从document属性获取
        const documentTheme = document.documentElement.getAttribute('data-theme') || 
                             (document.documentElement.getAttribute('class')?.includes('dark') ? 'dark' : 'light');
        currentTheme = documentTheme;
      }
    }

    const displayData = {
      system_language: currentLanguage,
      system_theme: currentTheme,
    };

    console.log('🎨 Sending display data to knowledge base iframe:', displayData);

    const iframe = document.querySelector('iframe[title*="知识库"], iframe[title*="Knowledge"], iframe[src*="/knowledge"]') as HTMLIFrameElement;
    
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'KNOWLEDGE_BASE_DISPLAY_DATA',
          data: displayData,
        },
        '*'
      );
      console.log('✅ Display data sent to knowledge base iframe');
    }
  } catch (error) {
    console.error('Failed to send display data to knowledge base iframe:', error);
  }
}

export class KnowledgeBaseIntegration {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // 生成知识库用户信息
  private generateKBUserData(email: string): KBAuthData {
    const kbEmail = `${process.env.NEXT_PUBLIC_KB_ACCOUNT_PREFIX}${email}`;
    return {
      email: kbEmail,
      nickname: kbEmail,
      password: kbEmail, // 密码也使用相同的值
    };
  }

  // RSA加密密码 - 完全按照RAGFlow的实现
  private async encryptPassword(password: string): Promise<string> {
    try {
      if (typeof window === 'undefined') {
        console.warn('RSA encryption not available on server side');
        return password;
      }

      // 动态导入避免SSR问题
      const { Base64 } = await import('js-base64');
      const JSEncrypt = (await import('jsencrypt')).default;

      // 使用与RAGFlow完全相同的公钥
      const publicKey = 
        '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArq9XTUSeYr2+N1h3Afl/z8Dse/2yD0ZGrKwx+EEEcdsBLca9Ynmx3nIB5obmLlSfmskLpBo0UACBmB5rEjBp2Q2f3AG3Hjd4B+gNCG6BDaawuDlgANIhGnaTLrIqWrrcm4EMzJOnAOI1fgzJRsOOUEfaS318Eq9OVO3apEyCCt0lOQK6PuksduOjVxtltDav+guVAA068NrPYmRNabVKRNLJpL8w4D44sfth5RvZ3q9t+6RTArpEtc5sh5ChzvqPOzKGMXW83C95TxmXqpbK6olN4RevSfVjEAgCydH6HN6OhtOQEcnrU97r9H0iZOWwbw3pVrZiUkuRD1R56Wzs2wIDAQAB-----END PUBLIC KEY-----';

      const encryptor = new JSEncrypt();
      encryptor.setPublicKey(publicKey);

      // 按照RAGFlow的逻辑：先Base64编码，再RSA加密
      const base64Password = Base64.encode(password);
      const encryptedPassword = encryptor.encrypt(base64Password);
      
      if (!encryptedPassword) {
        throw new Error('Password encryption failed');
      }

      return encryptedPassword;
    } catch (error) {
      console.error('Password encryption failed:', error);
      throw new Error(`Password encryption failed: ${error}`);
    }
  }

  // 检查用户是否已存在
  private async checkUserExists(email: string): Promise<boolean> {
    const stored = this.getStoredAuthData('kb_user_exists_' + email);
    return stored === 'true';
  }

  // 注册知识库用户
  async registerUser(email: string): Promise<{ success: boolean; userExists?: boolean; data?: KBUserData; error?: string }> {
    const userData = this.generateKBUserData(email);
    
    try {
      console.log('Attempting to register knowledge base user:', userData.email);
      
      const encryptedPassword = await this.encryptPassword(userData.password);
      
      const response = await fetch(`${this.baseUrl}/v1/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          nickname: userData.nickname,
          password: encryptedPassword,
        }),
      });

      const result: KBResponse = await response.json();
      
      if (result.code === 0) {
        console.log('Knowledge base user registered successfully:', userData.email);
        // 注册成功，同时也登录了，获取Authorization header
        const authorization = response.headers.get('Authorization');
        
        if (authorization && typeof result.data === 'object') {
          this.storeAuthData('kb_register_data', result);
          this.storeAuthData('kb_authorization', authorization);
          return { success: true, data: result.data as KBUserData };
        } else {
          return { success: false, error: 'Registration succeeded but missing authorization data' };
        }
      } else if (result.code === 103 && result.message.includes('already registered')) {
        console.log('Knowledge base user already exists:', userData.email);
        // 标记用户已存在
        this.storeAuthData('kb_user_exists_' + email, 'true');
        return { success: true, userExists: true };
      } else {
        console.error('Knowledge base user registration failed:', result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Knowledge base registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 登录知识库用户
  async loginUser(email: string): Promise<{ success: boolean; authorization?: string; data?: KBUserData; error?: string }> {
    const userData = this.generateKBUserData(email);
    
    try {
      console.log('Attempting to login knowledge base user:', userData.email);
      
      const encryptedPassword = await this.encryptPassword(userData.password);
      
      const response = await fetch(`${this.baseUrl}/v1/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: encryptedPassword,
        }),
      });

      const result: KBResponse = await response.json();
      const authorization = response.headers.get('Authorization');
      
      if (result.code === 0 && authorization && typeof result.data === 'object') {
        console.log('Knowledge base user logged in successfully:', userData.email);
        // 存储登录信息
        this.storeAuthData('kb_authorization', authorization);
        return { success: true, authorization, data: result.data as KBUserData };
      } else {
        console.error('Knowledge base user login failed:', result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Knowledge base login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 获取API Key
  async getApiKey(authorization: string): Promise<{ success: boolean; apiKey?: string; data?: KBTokenData[]; error?: string }> {
    try {
      console.log('Attempting to get knowledge base API key');
      
      const response = await fetch(`${this.baseUrl}/v1/system/token_list`, {
        method: 'GET',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
        },
      });

      const result: KBTokenResponse = await response.json();
      
      if (result.code === 0 && result.data && result.data.length > 0) {
        const apiKey = result.data[0].token;
        console.log('Knowledge base API key retrieved successfully');
        // 存储API key信息
        this.storeAuthData('kb_api_key', apiKey);
        return { success: true, apiKey, data: result.data };
      } else {
        console.error('Knowledge base API key retrieval failed:', result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Knowledge base API key retrieval error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 完整的知识库集成流程 - 确保执行顺序
  async integrateUser(email: string): Promise<{
    success: boolean;
    error?: string;
    data?: {
      registerResult?: any;
      loginResult: KBUserData;
      authorization: string;
      tokenResult: KBTokenData[];
      apiKey: string;
    };
  }> {
    try {
      console.log('🚀 Starting knowledge base integration for:', email);

      let registerResult: any;
      let loginResult: { success: boolean; authorization?: string; data?: KBUserData; error?: string };

      // 步骤1: 尝试注册用户
      console.log('📝 Step 1: Attempting user registration...');
      const registrationResult = await this.registerUser(email);
      
      if (!registrationResult.success && !registrationResult.userExists) {
        return {
          success: false,
          error: `Registration failed: ${registrationResult.error}`,
        };
      }

      if (registrationResult.userExists) {
        console.log('👤 User already exists, proceeding to login...');
        // 步骤2a: 用户已存在，直接登录
        loginResult = await this.loginUser(email);
      } else {
        console.log('✅ Registration successful, user also logged in automatically');
        // 步骤2b: 注册成功时会自动登录，但我们仍需要获取完整的登录数据
        const authorization = this.getStoredAuthData('kb_authorization');
        if (authorization && registrationResult.data) {
          loginResult = {
            success: true,
            authorization,
            data: registrationResult.data
          };
          registerResult = registrationResult;
        } else {
          // 如果注册后没有完整信息，重新登录
          loginResult = await this.loginUser(email);
        }
      }

      if (!loginResult.success || !loginResult.authorization || !loginResult.data) {
        return {
          success: false,
          error: `Login failed: ${loginResult.error}`,
        };
      }

      // 步骤3: 获取API Key
      console.log('🔑 Step 3: Retrieving API key...');
      const tokenResult = await this.getApiKey(loginResult.authorization);
      
      if (!tokenResult.success || !tokenResult.apiKey || !tokenResult.data) {
        return {
          success: false,
          error: `API key retrieval failed: ${tokenResult.error}`,
        };
      }

      console.log('🎉 Knowledge base integration completed successfully!');
      
      return {
        success: true,
        data: {
          registerResult,
          loginResult: loginResult.data,
          authorization: loginResult.authorization,
          tokenResult: tokenResult.data,
          apiKey: tokenResult.apiKey,
        },
      };
    } catch (error) {
      console.error('💥 Knowledge base integration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 存储认证数据到localStorage
  private storeAuthData(key: string, data: any): void {
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }

  // 获取存储的认证数据
  getStoredAuthData(key: string): any {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch {
        return data; // 如果不是JSON，直接返回字符串
      }
    } catch (error) {
      console.error('Failed to retrieve auth data:', error);
      return null;
    }
  }

  // 清除存储的认证数据
  clearStoredAuthData(): void {
    const keys = [
      'kb_register_data',
      'kb_authorization',
      'kb_api_key',
    ];
    
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    });

    // 清除用户存在标记
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('kb_user_exists_')) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`Failed to remove ${key}:`, error);
        }
      }
    });
  }
} 