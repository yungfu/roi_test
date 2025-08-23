export interface ImportResponse {
  success: boolean;
  message: string;
  data?: {
    importedCount: number;
    errors?: string[];
  };
}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

class ImportService {
  private apiBaseUrl = '/api';

  /**
   * 验证CSV文件格式
   */
  async validateFile(file: File): Promise<ValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.apiBaseUrl}/roifiles/validate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File validation failed:', error);
      throw new Error('文件验证失败，请检查网络连接或文件格式');
    }
  }

  /**
   * 导入ROI数据文件
   */
  async importFile(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.apiBaseUrl}/roifiles/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File import failed:', error);
      throw new Error('文件导入失败，请检查网络连接或文件格式');
    }
  }

  /**
   * 下载CSV模板
   */
  async downloadTemplate(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/roifiles/template`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'roi-data-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download failed:', error);
      throw new Error('模板下载失败，请检查网络连接');
    }
  }
}

export const importService = new ImportService();
