const envId = process.env.VUE_APP_CLOUDBASE_ENV_ID || ''
const useCloud = process.env.VUE_APP_USE_CLOUD === 'true'

export function isCloudReady() { return useCloud && Boolean(envId) }

export async function callCloudFunction(name, data) {
  if (!isCloudReady()) throw new Error(`CloudBase 尚未配置，不能调用 ${name}`)
  if (typeof wx === 'undefined' || !wx.cloud) throw new Error('当前运行环境不支持 wx.cloud')
  const response = await wx.cloud.callFunction({ name, data })
  return response.result
}

export async function getCloudFileURLs(fileIDs) {
  const uniqueFileIDs = [...new Set((fileIDs || []).filter(fileID => typeof fileID === 'string' && fileID.startsWith('cloud://')))]
  if (!uniqueFileIDs.length) return {}
  if (!isCloudReady() || typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.getTempFileURL !== 'function') return {}

  const result = {}
  for (let index = 0; index < uniqueFileIDs.length; index += 50) {
    const response = await wx.cloud.getTempFileURL({ fileList: uniqueFileIDs.slice(index, index + 50) })
    ;(response.fileList || []).forEach(file => {
      if (file.status === 0 && file.tempFileURL) result[file.fileID] = file.tempFileURL
    })
  }
  return result
}

export function initCloud() {
  if (!isCloudReady() || typeof wx === 'undefined' || !wx.cloud) return false
  wx.cloud.init({ env: envId, traceUser: true })
  return true
}
