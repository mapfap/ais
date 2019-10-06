const fs = require('fs')
const path = require('path')
const axios = require('axios')

const stream = fs.createWriteStream(path.join('output', 'output.csv'), { start: 0 })

stream.on('open', async (fd) => await main())
stream.on('error', (err) => console.error(err))

const main = async () => {
  try {

    stream.write('Tag,brandNameTH,brandNameEN,headLineTH,points,ussdNo,conditionTH,categoryTH,categoryType,locationTH,Mass,Gold\n')

    const res = await axios.get('https://privilege.ais.co.th/APP_PRIVILEGE/api/category')
    res.data.categoryArr.forEach(c => {    
      download('Privilege', `https://privilege.ais.co.th/APP_PRIVILEGE/api/privilege-info/${c.category}`, 1)
    })

    download('Serenade', `https://privilege.ais.co.th/APP_SERENADE/api/privilege/getPrivilegeInfo`, 1)

    // redeem%20line%20stickers >> Diff Format & Pagination
    const pointMenus = ['redeem%20premium%20delivery', 'shopping', 'entertainment', 'food%20&%20drink', 'device%20discount', 'internet', 'hot%20rewards', 'sticker']
    pointMenus.forEach(menu => {
      download('Point', `https://privilege.ais.co.th/APP_POINT/api/privilege-info/${menu}`, 1)
    })
    
  } catch (err) {
    console.error(err)
  }
}

const sanitize = (text) => text.replace(/\"/g)

const download = async (tag, endpoint, pageNumber) => {
  try {
    console.log(`download[${tag}]: #${pageNumber} ${endpoint}`)
    
    const res = await axios.get(`${endpoint}?pageNumber=${pageNumber}`)
    let totalPage = 1
    res.data.privilegeInfoArr.forEach(p => {
      totalPage = res.data.totalPage || 1
      let record = `"${tag}",`
      record += `\"${sanitize(p.brandNameTH)}\",`
      record += `\"${sanitize(p.brandNameEN)}\",`
      record += `\"${sanitize(p.headLineTH)}\",`
      record += `\"${sanitize(p.points)}\",`
      record += `\"${sanitize(p.ussdNo)}\",`
      record += `\"${sanitize(p.conditionTH)}\",`
      record += `\"${sanitize(p.categoryTH)}\",`
      record += `\"${sanitize(p.categoryType)}\",`
      record += `\"${sanitize(p.locationTH)}\",`
      
      let mass = ''
      let gold = ''

      for (const s of p.descriptionArr) {
        if (s.segment == 'Gold') {
          gold = sanitize(s.descTH)
        } else if (s.segment == 'Mass' || s.segment == 'All') {
          mass = sanitize(s.descTH)
        }
      }

      record += `\"${mass}\",\"${gold}\"`

      stream.write(record + '\n')
    
    })

    if (pageNumber < totalPage) {
      download(tag, endpoint, pageNumber+1)
    }
  } catch (err) {
    console.error(err)
  }
}