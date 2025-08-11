// 实时汇率服务
export class ExchangeRateService {
  constructor() {
    this.rates = {
      'USD_MXN': 20.0, // 默认汇率
      'MXN_USD': 0.05
    };
    this.lastUpdate = null;
  }

  // 获取实时汇率
  async getExchangeRate(from = 'USD', to = 'MXN') {
    try {
      // 如果缓存的汇率还是最近的，直接返回
      if (this.lastUpdate && Date.now() - this.lastUpdate < 3600000) { // 1小时缓存
        return this.rates[`${from}_${to}`] || 20.0;
      }

      // 尝试获取实时汇率
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      if (response.ok) {
        const data = await response.json();
        if (data.rates && data.rates[to]) {
          this.rates[`${from}_${to}`] = data.rates[to];
          this.rates[`${to}_${from}`] = 1 / data.rates[to];
          this.lastUpdate = Date.now();
          console.log(`汇率更新: 1 ${from} = ${data.rates[to]} ${to}`);
          return data.rates[to];
        }
      }
    } catch (error) {
      console.warn('获取实时汇率失败，使用默认汇率:', error);
    }

    // 返回默认汇率
    return this.rates[`${from}_${to}`] || 20.0;
  }

  // USD转MXN
  async usdToMxn(usdAmount) {
    const rate = await this.getExchangeRate('USD', 'MXN');
    return usdAmount * rate;
  }

  // MXN转USD  
  async mxnToUsd(mxnAmount) {
    const rate = await this.getExchangeRate('MXN', 'USD');
    return mxnAmount * rate;
  }

  // 格式化墨西哥比索
  formatMXN(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // 格式化美元
  formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

export const exchangeService = new ExchangeRateService();