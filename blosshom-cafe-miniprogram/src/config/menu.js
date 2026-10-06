// 演示菜单来源：咖啡轻食鸡尾酒菜单.xlsx。
// 金额统一使用人民币分；图片使用相对于页面/组件目录的本地路径，避免开发者工具复用旧扩展名缓存。
export const categories = [
  { id: 'coffee', name: '咖啡', sort: 10 },
  { id: 'mains', name: '主食', sort: 20 },
  { id: 'food', name: '小食', sort: 30 },
  { id: 'cocktails', name: '酒水', sort: 40 }
]

const noOptions = { temperature: [], size: [], sugar: [] }

export const products = [
  { id: 'C001', name: '浓缩咖啡 / Espresso', category: 'coffee', description: '30 ml / 热 · 醇厚浓郁，带焦糖与坚果香气 · 建议堂食', basePrice: 1000, enabled: true, soldOut: false, sort: 10, featured: true, image: '../../static/menu-images/C001.jpg', imageTone: '#B88964', options: noOptions },
  { id: 'C002', name: '拿铁 / Latte', category: 'coffee', description: '360 ml / 热 · 意式浓缩与顺滑牛奶，口感柔和 · 可换燕麦奶 +5 元（请备注）', basePrice: 2200, enabled: true, soldOut: false, sort: 20, featured: true, image: '../../static/menu-images/C002.jpg', imageTone: '#CFAB84', options: noOptions },
  { id: 'C003', name: '冰美式 / Iced Americano', category: 'coffee', description: '450 ml / 冰 · 清爽干净，突出咖啡豆本味 · 默认少冰', basePrice: 1800, enabled: true, soldOut: false, sort: 30, featured: false, image: '../../static/menu-images/C003.jpg', imageTone: '#8F715D', options: noOptions },
  { id: 'C004', name: '香橙气泡咖啡 / Orange Sparkling Coffee', category: 'coffee', description: '450 ml / 冰 · 鲜橙、气泡水与浓缩咖啡的明亮组合 · 季节限定', basePrice: 2800, enabled: true, soldOut: false, sort: 40, featured: true, image: '../../static/menu-images/C004.jpg', imageTone: '#D69B62', options: noOptions },
  { id: 'C005', name: '生椰拿铁 / Coconut Latte', category: 'coffee', description: '450 ml / 冰 · 椰乳与浓缩咖啡交融，清甜顺滑 · 默认少冰', basePrice: 2800, enabled: true, soldOut: false, sort: 50, featured: false, image: '../../static/menu-images/C005.jpg', imageTone: '#D7C5A6', options: noOptions },
  { id: 'C006', name: '冰拿铁 / Iced Latte', category: 'coffee', description: '450 ml / 冰 · 冷牛奶搭配意式浓缩，柔和清爽 · 可换燕麦奶 +5 元（请备注）', basePrice: 2400, enabled: true, soldOut: false, sort: 60, featured: false, image: '../../static/menu-images/C006.jpg', imageTone: '#BFA083', options: noOptions },
  { id: 'C007', name: '冰镇浓缩汤力 / Iced Espresso Tonic', category: 'coffee', description: '450 ml / 冰 · 汤力水气泡与浓缩咖啡，微苦明亮 · 含奎宁', basePrice: 2800, enabled: true, soldOut: false, sort: 70, featured: false, image: '../../static/menu-images/C007.jpg', imageTone: '#A9AD91', options: noOptions },
  { id: 'C008', name: '馥芮白 / Flat White', category: 'coffee', description: '240 ml / 热 · 双份浓缩与细腻微奶泡，咖啡感更突出 · 可换燕麦奶 +5 元（请备注）', basePrice: 2400, enabled: true, soldOut: false, sort: 80, featured: false, image: '../../static/menu-images/C008.jpg', imageTone: '#C9B194', options: noOptions },
  { id: 'C009', name: '摩卡 / Café Mocha', category: 'coffee', description: '360 ml / 热 · 浓缩咖啡、巧克力与牛奶，醇厚香甜 · 含乳制品、巧克力', basePrice: 2800, enabled: true, soldOut: false, sort: 90, featured: false, image: '../../static/menu-images/C009.jpg', imageTone: '#A77D62', options: noOptions },
  { id: 'C010', name: '焦糖玛奇朵 / Caramel Macchiato', category: 'coffee', description: '360 ml / 热 · 香草牛奶、浓缩咖啡与焦糖风味 · 甜度可调整', basePrice: 3000, enabled: true, soldOut: false, sort: 100, featured: false, image: '../../static/menu-images/C010.jpg', imageTone: '#C49A70', options: noOptions },
  { id: 'C011', name: '冷萃咖啡 / Cold Brew', category: 'coffee', description: '450 ml / 冰 · 低温慢萃，口感圆润、清爽低酸 · 每日限量', basePrice: 2400, enabled: true, soldOut: false, sort: 110, featured: false, image: '../../static/menu-images/C011.jpg', imageTone: '#8A624A', options: noOptions },

  { id: 'F001', name: '黄油可颂 / Butter Croissant', category: 'food', description: '1 个 / 约 80 g · 外酥内软，黄油香气饱满 · 可加热', basePrice: 1800, enabled: true, soldOut: false, sort: 10, featured: true, image: '../../static/menu-images/F001.jpg', imageTone: '#D8B272', options: noOptions },
  { id: 'F002', name: '鸡米花 / Popcorn Chicken', category: 'food', description: '1 份 / 约 220 g · 酥脆鸡肉小块，外脆里嫩，带轻微香料风味 · 可搭配番茄酱或蛋黄酱', basePrice: 3200, enabled: true, soldOut: false, sort: 20, featured: false, image: '../../static/menu-images/F002.jpg', imageTone: '#C8945E', options: noOptions },
  { id: 'F003', name: '薯条 / French Fries', category: 'food', description: '1 份 / 约 200 g · 金黄酥脆，现炸后轻撒海盐 · 建议趁热食用', basePrice: 2800, enabled: true, soldOut: false, sort: 30, featured: false, image: '../../static/menu-images/F003.jpg', imageTone: '#D5B35F', options: noOptions },
  { id: 'F004', name: '火腿芝士帕尼尼 / Ham & Cheese Panini', category: 'food', description: '1 份 / 约 280 g · 火腿、融化芝士与烤脆面包 · 含乳制品、麸质', basePrice: 3800, enabled: true, soldOut: false, sort: 40, featured: false, image: '../../static/menu-images/F004.jpg', imageTone: '#B68D69', options: noOptions },
  { id: 'F005', name: '番茄意面 / Tomato Pasta', category: 'mains', description: '1 份 / 约 320 g · 番茄酱汁、意面、罗勒与帕玛森芝士 · 含乳制品、麸质', basePrice: 3200, enabled: true, soldOut: false, sort: 10, featured: false, image: '../../static/menu-images/F005.jpg', imageTone: '#B8755E', options: noOptions },
  { id: 'M002', name: '日式咖喱鸡饭 / Japanese Chicken Curry Rice', category: 'mains', description: '1 份 / 约 420 g · 嫩鸡肉、蔬菜咖喱与米饭，温和浓郁 · 咖喱酱可能含麸质', basePrice: 3800, enabled: true, soldOut: false, sort: 20, featured: false, image: '../../static/menu-images/M002.jpg', imageTone: '#B99057', options: noOptions },

  { id: 'A001', name: '金汤力 / Gin & Tonic', category: 'cocktails', description: '300 ml / 酒精度约 12% · 金酒、汤力水、青柠与杜松子 · 含酒精，仅限成年人', basePrice: 6800, enabled: false, soldOut: false, sort: 910, featured: false, image: '../../static/menu-images/A001.jpg', imageTone: '#AAB49B', options: noOptions },
  { id: 'A002', name: '莫吉托 / Mojito', category: 'cocktails', description: '350 ml / 酒精度约 10% · 白朗姆、薄荷、青柠与苏打水 · 含酒精，仅限成年人', basePrice: 6800, enabled: false, soldOut: false, sort: 920, featured: false, image: '../../static/menu-images/A002.jpg', imageTone: '#8FA78C', options: noOptions },
  { id: 'A003', name: '古典鸡尾酒 / Old Fashioned', category: 'cocktails', description: '120 ml / 酒精度约 28% · 威士忌、苦精、糖与橙皮 · 含酒精，仅限成年人', basePrice: 6800, enabled: false, soldOut: false, sort: 930, featured: false, image: '../../static/menu-images/A003.jpg', imageTone: '#A46F51', options: noOptions },
  { id: 'A005', name: '金菲士 / Gin Fizz', category: 'cocktails', description: '300 ml / 酒精度约 11% · 清爽、柠檬、气泡 · 含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 10, featured: false, image: '../../static/menu-images/A005.jpg', imageTone: '#D8D2B6', options: noOptions },
  { id: 'A006', name: '罗勒碎金酒 / Gin Basil Smash', category: 'cocktails', description: '180 ml / 酒精度约 18% · 罗勒、柠檬、清爽 · 含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 20, featured: false, image: '../../static/menu-images/A006.jpg', imageTone: '#9AAF80', options: noOptions },
  { id: 'A007', name: '百香果马天尼 / Pornstar Martini', category: 'cocktails', description: '160 ml + 佐饮 / 酒精度约 17% · 百香果、热带、酸甜 · 含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 30, featured: false, image: '../../static/menu-images/A007.jpg', imageTone: '#D7A757', options: noOptions },
  { id: 'A008', name: '玛格丽特 / Margarita', category: 'cocktails', description: '140 ml / 酒精度约 21% · 青柠、冲击、酸甜 · 含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 40, featured: false, image: '../../static/menu-images/A008.jpg', imageTone: '#D9D6B7', options: noOptions },
  { id: 'A009', name: '威士忌酸 / Whiskey Sour', category: 'cocktails', description: '160 ml / 酒精度约 18% · 柠檬、酸甜、威士忌 · 含蛋清；含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 50, featured: false, image: '../../static/menu-images/A009.jpg', imageTone: '#D0A25D', options: noOptions },
  { id: 'A010', name: '代基里 / Daiquiri', category: 'cocktails', description: '120 ml / 酒精度约 22% · 青柠、干净、酸甜 · 含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 60, featured: false, image: '../../static/menu-images/A010.jpg', imageTone: '#D8D4BD', options: noOptions },
  { id: 'A011', name: '长岛冰茶 / Long Island Iced Tea', category: 'cocktails', description: '350 ml / 酒精度约 18% · 烈性、柠檬、可乐 · 烈度较高；仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 70, featured: false, image: '../../static/menu-images/A011.jpg', imageTone: '#A8754B', options: noOptions },
  { id: 'A004', name: '阿佩罗橙光 / Aperol Spritz', category: 'cocktails', description: '300 ml / 酒精度约 11% · 橙子、气泡、微苦 · 含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 80, featured: false, image: '../../static/menu-images/A004.jpg', imageTone: '#D37A50', options: noOptions },
  { id: 'A012', name: '龙舌兰日出 / Tequila Sunrise', category: 'cocktails', description: '300 ml / 酒精度约 12% · 橙子、石榴、日出感 · 含酒精，仅限成年人', basePrice: 6800, enabled: true, soldOut: false, sort: 90, featured: false, image: '../../static/menu-images/A012.jpg', imageTone: '#E09A55', options: noOptions }
]

export const optionLabels = { iced: '冰', hot: '热', regular: '标准杯', large: '大杯', none: '无糖', half: '半糖', standard: '标准糖' }
export const optionPrice = { large: 300 }
