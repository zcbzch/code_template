/**
 * 不变的重复请求缓存
 * 对于首次异步任务中执行的异步任务也做了限制
 */

const AXIOS_STATUS = {
  Pending: 'pending',
  Fulfilled: 'fullfilled',
  Rejected: 'rejected',
}
const STATUS = {
  OK: 200
}
class FrontRequestCache {
  mallId: string
  API: any
  
  cache: Map<string, any> = new Map()
  cacheStatus: Map<string, any> = new Map()
  cacheQueue: { [key: string]: Array<Function> } = {}

  private async cacheHelper(cacheKey, request): Promise<any> {
    return this.asyncHelper(async (callback) => {
      let result = null;
      const status = this.cacheStatus.get(cacheKey)
      // using cache
      if (status === AXIOS_STATUS.Fulfilled) {
        result = this.cache.get(cacheKey)
      }
  
      // need request
      if (!status || status === AXIOS_STATUS.Rejected) {
        this.cacheStatus.set(cacheKey, AXIOS_STATUS.Pending);
        const res = await request();
        if (res.status === STATUS.OK) {
          this.cache.set(cacheKey, res)
          this.cacheStatus.set(cacheKey, AXIOS_STATUS.Fulfilled)
        } else {
          this.cacheStatus.set(cacheKey, AXIOS_STATUS.Rejected)
        }
        result = this.cache.get(cacheKey)
        this.cacheQueue[cacheKey].push(callback)
        this.cacheQueue[cacheKey].forEach(cb => cb(result))
      }
  
      // you know
      if (status === AXIOS_STATUS.Pending) {
        if (!this.cacheQueue[cacheKey]) {
          this.cacheQueue[cacheKey] = []
        }
        this.cacheQueue[cacheKey].push(callback)
      }
    })
  }

  private async asyncHelper(callback): Promise<any> {
    return new Promise(resolve => callback(resolve))
  }

  async fetchMallInfo(): Promise<any> {
    return this.cacheHelper(
      `fetchMallInfo:${this.mallId}`, 
      () => this.API.fetchMallInfo(this.mallId))
  }
}