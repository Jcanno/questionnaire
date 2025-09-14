import CryptoJS from 'crypto-js';

const KEY = 'questionnaire_data_key'
const LENGTH = 15

export const encrypt = (data: string): string => {
  try {
    const encryptedData = CryptoJS.AES.encrypt(data, KEY).toString()
    return encryptedData
  } catch (error) {
    console.error('Encrypt error:', error)
    return data // 如果加密失败，返回原始数据
  }
}

export const decrypt = (data: string): any => {
  // 处理空格和换行
  const filteredData = data.trim().replace(/\s/g, '+').replace(/\n/g, '')
  try {
    if (!data) {
      console.warn('Decrypt: data is empty')
      return null
    }
    
    const decryptedData = CryptoJS.AES.decrypt(filteredData, KEY).toString(CryptoJS.enc.Utf8)
    
    if (!decryptedData) {
      console.warn('Decrypt: decrypted data is empty')
      return null
    }
    
    // 尝试解析 JSON
    try {
      return JSON.parse(decryptedData)
    } catch (parseError) {
      console.log('JSON parse error, returning raw string:', parseError)
      return decryptedData
    }
  } catch (error) {
    console.error('Decrypt error:', error)
    return null
  }
}

export const randomString = (): string => {
  return CryptoJS.lib.WordArray.random(LENGTH).toString()
}