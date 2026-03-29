// ============================================================
// PROBOT LOCAL KNOWLEDGE BASE
// Dữ liệu khu vực/đường phố phục vụ RAG (Retrieval-Augmented Generation)
// Cập nhật: 2026 — Đà Nẵng, TP. Hồ Chí Minh, Hà Nội
// ============================================================

export interface StreetInfo {
  name: string;
  reason: string;
  amenities: string[];
  price_range: { min: number; max: number }; // triệu VNĐ/tháng
  types: string[];   // loại phòng phổ biến
  target: string[];  // đối tượng phù hợp
  pros: string[];
  cons: string[];
}

export interface DistrictKnowledge {
  district: string;
  city: string;
  aliases: string[];   // các tên gọi khác, viết thường không dấu
  overview: string;
  avg_price: { min: number; max: number };
  streets: StreetInfo[];
  pros: string[];
  cons: string[];
  target_audience: string[];
  universities?: string[]; // Thêm trường lưu tên các trường đại học
}

// ============================================================
// ĐÀ NẴNG
// ============================================================

const danang_haichau: DistrictKnowledge = {
  district: "Hải Châu",
  city: "Đà Nẵng",
  aliases: ["hai chau", "hải châu", "trung tam da nang", "q hải châu", "quận hải châu"],
  overview:
    "Hải Châu là quận trung tâm hành chính và thương mại của Đà Nẵng. Tiếp giáp sông Hàn và gần biển Mỹ Khê. Phù hợp với người đi làm văn phòng, công chức, người muốn sống tại trung tâm.",
  avg_price: { min: 2.5, max: 7 },
  pros: [
    "Trung tâm thành phố, thuận tiện đi lại mọi hướng",
    "Gần sông Hàn và biển Mỹ Khê",
    "Hạ tầng tốt, điện nước ổn định",
    "Nhiều nhà hàng, cafe, siêu thị",
    "Gần bệnh viện C và bệnh viện Đà Nẵng",
  ],
  cons: [
    "Giá thuê cao hơn các quận khác",
    "Kẹt xe vào giờ cao điểm",
    "Ít phòng trọ giá rẻ",
  ],
  target_audience: ["Công chức", "Nhân viên văn phòng", "Người đi làm lâu năm", "Gia đình nhỏ"],
  universities: ["Đại học Đông Á", "dong a", "Đại học Kiến Trúc", "kien truc", "Đại học Kỹ thuật Y Dược"],
  streets: [
    {
      name: "Trần Phú",
      reason:
        "Đường ven biển nổi tiếng, gần cầu Rồng và cầu Sông Hàn. Phòng trọ tập trung ở các hẻm nhỏ song song. Rất thuận tiện cho người thích sống gần biển.",
      amenities: [
        "Biển Mỹ Khê cách 500m",
        "Cầu Rồng 1km",
        "Chợ Hàn 800m",
        "Bệnh viện C Đà Nẵng 1.5km",
        "Nhiều quán ăn đặc sản Đà Nẵng",
      ],
      price_range: { min: 3, max: 6 },
      types: ["phòng trọ", "studio", "căn hộ mini"],
      target: ["Nhân viên văn phòng", "Công chức", "Người thích view biển"],
      pros: ["Không khí trong lành", "Gần biển đi tắm buổi sáng", "Nhiều dịch vụ tiện ích"],
      cons: ["Giá cao hơn bình thường", "Có thể ồn ào khu du lịch"],
    },
    {
      name: "Nguyễn Chí Thanh",
      reason:
        "Trục đường thương mại lớn, gần chợ Cồn — chợ lớn nhất Đà Nẵng. Nhiều phòng trọ trong hẻm giá hợp lý.",
      amenities: [
        "Chợ Cồn cách 300m",
        "Vincom Plaza 1km",
        "Nhiều quán ăn bình dân",
        "Trường THPT Phan Châu Trinh 500m",
        "Siêu thị BigC 2km",
      ],
      price_range: { min: 2, max: 4.5 },
      types: ["phòng trọ", "nhà trọ nguyên căn"],
      target: ["Sinh viên", "Công nhân", "Người mới ra trường"],
      pros: ["Đi chợ tiện lợi", "Giá cả phải chăng hơn mặt đường lớn", "Nhiều lựa chọn ăn uống"],
      cons: ["Khu vực đông đúc, ồn ào", "Giao thông hỗn loạn gần chợ"],
    },
    {
      name: "Lê Duẩn",
      reason:
        "Tuyến đường trung tâm kết nối ga Đà Nẵng với sân bay. Thuận tiện di chuyển bằng phương tiện công cộng và xe công nghệ.",
      amenities: [
        "Ga Đà Nẵng 500m",
        "Siêu thị Co.op Mart 800m",
        "Công viên 29/3 1km",
        "Rạp chiếu phim CGV 1.5km",
        "BigC 2km",
      ],
      price_range: { min: 3.5, max: 7 },
      types: ["căn hộ mini", "studio", "chung cư mini"],
      target: ["Nhân viên văn phòng", "Gia đình trẻ", "Người hay đi công tác"],
      pros: ["Giao thông cực kỳ thuận tiện", "Gần ga và sân bay", "Khu vực an ninh tốt"],
      cons: ["Giá cao nhất quận", "Ít phòng trọ bình dân"],
    },
    {
      name: "Ông Ích Khiêm",
      reason:
        "Đường nội khu yên tĩnh, gần bệnh viện và trường học. Phù hợp gia đình có con nhỏ hoặc người cần môi trường yên tĩnh.",
      amenities: [
        "Bệnh viện Phụ Sản Đà Nẵng 600m",
        "Trường tiểu học Lê Văn Tám 400m",
        "Chợ dân sinh gần đó",
        "Ngân hàng đầy đủ",
      ],
      price_range: { min: 2, max: 4 },
      types: ["phòng trọ", "nhà nguyên căn nhỏ"],
      target: ["Gia đình trẻ có con nhỏ", "Nhân viên bệnh viện", "Người cần môi trường yên tĩnh"],
      pros: ["Yên tĩnh, an toàn", "Gần bệnh viện", "Giá hợp lý hơn mặt đường lớn"],
      cons: ["Xa trung tâm hơn", "Ít dịch vụ giải trí"],
    },
  ],
};

const danang_thanhkhe: DistrictKnowledge = {
  district: "Thanh Khê",
  city: "Đà Nẵng",
  aliases: ["thanh khe", "thanh khê", "q thanh khe", "quận thanh khê"],
  overview:
    "Thanh Khê là quận đông dân nhất Đà Nẵng, giáp quận Hải Châu về phía Tây. Tập trung nhiều sinh viên và người lao động. Giá thuê phòng phổ biến và cạnh tranh nhất thành phố.",
  avg_price: { min: 1.5, max: 4 },
  pros: [
    "Giá thuê rẻ nhất khu vực trung tâm",
    "Nhiều phòng trọ lựa chọn",
    "Gần nhiều trường đại học",
    "Cộng đồng sinh viên sôi động",
    "Chợ và siêu thị đầy đủ",
  ],
  cons: [
    "Xa biển hơn Hải Châu",
    "Khu dân cư đông đúc, đôi khi ồn ào",
    "Cơ sở hạ tầng một số nơi chưa đồng đều",
  ],
  target_audience: ["Sinh viên", "Người lao động", "Công nhân", "Người mới lên thành phố"],
  universities: ["Đại học Duy Tân", "duy tan", "Đại học Thể dục Thể thao", "tdtt"],
  streets: [
    {
      name: "Điện Biên Phủ",
      reason:
        "Đường lớn kết nối Hải Châu với Thanh Khê, gần ĐH Đà Nẵng và ĐH Kinh Tế. Phòng trọ giá sinh viên tập trung đông.",
      amenities: [
        "Đại học Đà Nẵng 1km",
        "Đại học Kinh Tế 800m",
        "Chợ Thanh Khê 500m",
        "Nhiều quán ăn sinh viên giá rẻ",
        "Nhà sách, photocopy tiện lợi",
      ],
      price_range: { min: 1.5, max: 3 },
      types: ["phòng trọ", "nhà trọ ghép"],
      target: ["Sinh viên ĐH Đà Nẵng", "Sinh viên ĐH Kinh Tế"],
      pros: ["Rất gần trường", "Giá rẻ nhất khu vực", "Cộng đồng sinh viên đông vui"],
      cons: ["Đông đúc, ồn ào", "Phòng trọ cũ hơn các khu mới"],
    },
    {
      name: "Nguyễn Tri Phương",
      reason:
        "Đường dân sinh yên tĩnh hơn, xen kẽ khu dân cư và phòng trọ. Phù hợp người đi làm muốn thuê giá tốt gần trung tâm.",
      amenities: [
        "Siêu thị MM Mega Market 1.5km",
        "Bệnh viện 199 1km",
        "Công viên nội khu",
        "Chợ dân sinh tiện",
      ],
      price_range: { min: 1.8, max: 3.5 },
      types: ["phòng trọ", "phòng trong nhà dân"],
      target: ["Người đi làm", "Sinh viên năm 2-4"],
      pros: ["Yên tĩnh hơn mặt đường lớn", "Gần siêu thị lớn", "An ninh tốt"],
      cons: ["Ít tiện ích giải trí"],
    },
    {
      name: "Tôn Đức Thắng",
      reason:
        "Khu vực nằm sát ranh giới Hải Châu, tiện đi lại cả hai quận. Phòng có chất lượng tốt hơn với giá trung bình.",
      amenities: [
        "Cách trung tâm Hải Châu 10 phút xe máy",
        "Nhiều quán cà phê làm việc",
        "Gần cầu Nguyễn Văn Trỗi",
        "Chợ và siêu thị gần",
      ],
      price_range: { min: 2, max: 4 },
      types: ["phòng trọ", "chung cư mini", "studio"],
      target: ["Nhân viên văn phòng", "Người muốn cân bằng giá-vị trí"],
      pros: ["Vị trí linh hoạt giữa 2 quận", "Giá hợp lý", "Phòng mới hơn"],
      cons: ["Giao thông đôi khi đông"],
    },
  ],
};

const danang_sontra: DistrictKnowledge = {
  district: "Sơn Trà",
  city: "Đà Nẵng",
  aliases: ["son tra", "sơn trà", "q son tra", "quận sơn trà", "da nang bien"],
  overview:
    "Sơn Trà nằm ở bán đảo phía Đông Đà Nẵng, sở hữu đường bờ biển dài và bán đảo Sơn Trà hoang sơ. Phù hợp người yêu thiên nhiên, làm việc remote hoặc ngành du lịch-khách sạn.",
  avg_price: { min: 2, max: 5 },
  pros: [
    "Không khí trong lành, gần biển và rừng",
    "Ít bụi và ồn ào hơn trung tâm",
    "View đẹp, phù hợp làm việc remote",
    "Phát triển du lịch mạnh",
  ],
  cons: [
    "Xa trung tâm hành chính",
    "Giá tăng theo phát triển du lịch",
    "Thiếu trường học và bệnh viện lớn",
  ],
  target_audience: ["Người làm du lịch-khách sạn", "Làm việc remote", "Người yêu thiên nhiên"],
  streets: [
    {
      name: "Võ Nguyên Giáp",
      reason:
        "Con đường biển đẹp nhất Đà Nẵng, chạy dọc theo bãi biển Mỹ Khê. Cung cấp nhiều resort và phòng ở cạnh biển.",
      amenities: [
        "Biển Mỹ Khê ngay bên cạnh",
        "Nhiều resort 4-5 sao quanh đó",
        "Nhà hàng hải sản tươi sống",
        "Khu thể thao biển",
      ],
      price_range: { min: 2.5, max: 5 },
      types: ["căn hộ du lịch", "studio view biển", "phòng trọ"],
      target: ["Nhân viên resort", "Người làm remote", "Người yêu biển"],
      pros: ["View biển đẹp", "Không khí biển trong lành", "Tiện nghi du lịch"],
      cons: ["Giá cao hơn bình thường", "Mùa đông ít hoạt động"],
    },
    {
      name: "An Thượng",
      reason:
        "Khu phố Tây sôi động, tập trung nhiều bar, nhà hàng quốc tế, co-working space. Cộng đồng expat và freelancer đông.",
      amenities: [
        "Hơn 50 nhà hàng quốc tế",
        "Co-working space",
        "Siêu thị tiện lợi",
        "Biển cách 200m",
        "Café và bar sôi động",
      ],
      price_range: { min: 3, max: 6 },
      types: ["studio", "căn hộ mini", "phòng cao cấp"],
      target: ["Freelancer", "Digital nomad", "Expat", "Người làm ngành quốc tế"],
      pros: ["Cộng đồng quốc tế", "Gần biển và tiện ích đầy đủ", "Sôi động"],
      cons: ["Giá thuê khá cao", "Ồn ào vào buổi tối"],
    },
  ],
};

const danang_nguhanson: DistrictKnowledge = {
  district: "Ngũ Hành Sơn",
  city: "Đà Nẵng",
  aliases: [
    "ngu hanh son",
    "ngũ hành sơn",
    "q ngu hanh son",
    "quận ngũ hành sơn",
    "da nang nam",
    "non nuoc",
    "nôn nuốc",
  ],
  overview:
    "Ngũ Hành Sơn nằm phía Nam Đà Nẵng, giáp Quảng Nam. Nổi tiếng với làng đá mỹ nghệ Non Nước và bãi biển đẹp. Khu đô thị mới đang phát triển mạnh, nhiều dự án chung cư.",
  avg_price: { min: 1.8, max: 4.5 },
  pros: [
    "Khu đô thị mới, phòng ốc hiện đại hơn",
    "Cạnh biển và danh thắng Ngũ Hành Sơn",
    "Gần Hội An (~20km)",
    "Không khí trong lành",
  ],
  cons: [
    "Xa trung tâm (từ 7-12km)",
    "Thiếu bệnh viện lớn và trường ĐH",
    "Giao thông phụ thuộc xe máy/ô tô",
  ],
  target_audience: ["Gia đình", "Người làm du lịch Hội An", "Người thích khu mới yên tĩnh"],
  universities: ["Đại học Kinh Tế", "kinh te", "FPT Đà Nẵng", "fpt", "Đại học Việt Hàn", "viet han", "ĐH CNTT", "Công nghệ thông tin"],
  streets: [
    {
      name: "Trường Sa",
      reason:
        "Đường ven biển kết nối nhiều khu resort và nhà hàng. Phòng trọ và căn hộ chất lượng tốt với môi trường yên tĩnh.",
      amenities: [
        "Biển Non Nước cách 300m",
        "Danh thắng Ngũ Hành Sơn 1km",
        "Nhiều resort ven biển",
        "Làng đá mỹ nghệ",
      ],
      price_range: { min: 2, max: 4.5 },
      types: ["phòng trọ", "chung cư mini", "studio"],
      target: ["Nhân viên resort", "Gia đình trẻ", "Người làm ở Hội An"],
      pros: ["Yên tĩnh, trong lành", "Gần biển đẹp", "Môi trường an toàn cho gia đình"],
      cons: ["Xa trung tâm", "Ít tiện ích đô thị"],
    },
  ],
};

const danang_lienchieu: DistrictKnowledge = {
  district: "Liên Chiểu",
  city: "Đà Nẵng",
  aliases: ["lien chieu", "liên chiểu", "q lien chieu", "quận liên chiểu", "da nang bac", "nam o"],
  overview:
    "Liên Chiểu là quận phía Bắc Đà Nẵng, tập trung nhiều khu công nghiệp và trường đại học. Là lựa chọn hàng đầu cho công nhân KCN và sinh viên ĐH Bách Khoa, ĐH Sư Phạm.",
  avg_price: { min: 1.2, max: 3 },
  pros: [
    "Giá thuê rẻ nhất Đà Nẵng",
    "Gần 3 trường đại học lớn",
    "Gần các KCN Liên Chiểu, Hòa Khánh",
    "Bờ biển Nam Ô hoang sơ gần đó",
  ],
  cons: [
    "Xa trung tâm nhất (15-20km từ Hải Châu)",
    "Ô nhiễm từ KCN ở một số khu vực",
    "Thiếu dịch vụ cao cấp",
  ],
  target_audience: ["Công nhân KCN", "Sinh viên ĐH Bách Khoa", "Sinh viên ĐH Sư Phạm"],
  universities: ["Đại học Bách Khoa", "bach khoa", "bku", "Đại học Sư Phạm", "su pham", "Cao đẳng Kinh tế Kế hoạch"],
  streets: [
    {
      name: "Nguyễn Lương Bằng",
      reason:
        "Trục đường chính Liên Chiểu, gần cổng ĐH Bách Khoa và ĐH Sư Phạm. Phòng trọ sinh viên giá rẻ tập trung đông.",
      amenities: [
        "ĐH Bách Khoa Đà Nẵng cách 500m",
        "ĐH Sư Phạm Đà Nẵng 800m",
        "Nhiều quán ăn giá sinh viên",
        "Chợ Liên Chiểu 1km",
        "Photocopy, nhà sách",
      ],
      price_range: { min: 1.2, max: 2.5 },
      types: ["phòng trọ", "nhà trọ ghép", "KTX dân lập"],
      target: ["Sinh viên Bách Khoa", "Sinh viên Sư Phạm"],
      pros: ["Rẻ nhất thành phố", "Đi học 5 phút", "Cộng đồng sinh viên lớn"],
      cons: ["Xa trung tâm thành phố", "Phòng trọ cũ, chất lượng thấp hơn"],
    },
    {
      name: "Hoàng Văn Thái",
      reason:
        "Gần KCN Hòa Khánh, tập trung công nhân. Phòng trọ xây mới nhiều, giá cạnh tranh.",
      amenities: [
        "KCN Hòa Khánh 1km",
        "Siêu thị Coopmart Liên Chiểu 2km",
        "Chợ dân sinh tiện",
        "Bến xe buýt đi trung tâm",
      ],
      price_range: { min: 1.2, max: 2.8 },
      types: ["phòng trọ", "nhà trọ nguyên căn"],
      target: ["Công nhân KCN Hòa Khánh", "Công nhân KCN Liên Chiểu"],
      pros: ["Gần chỗ làm KCN", "Giá rẻ", "Phòng mới xây nhiều"],
      cons: ["Xa trung tâm", "Khu vực đông công nhân"],
    },
  ],
};

// ============================================================
// TP. HỒ CHÍ MINH
// ============================================================

const hcm_quan1: DistrictKnowledge = {
  district: "Quận 1",
  city: "TP. Hồ Chí Minh",
  aliases: ["quan 1", "quận 1", "q1", "trung tam sai gon", "sai gon", "saigon center"],
  overview:
    "Quận 1 là trung tâm hành chính, tài chính, thương mại của TP. Hồ Chí Minh. Giá thuê đắt đỏ nhất thành phố, nhưng hạ tầng và tiện ích hoàn hảo.",
  avg_price: { min: 5, max: 20 },
  pros: [
    "Trung tâm thành phố, đi đâu cũng gần",
    "Hệ thống metro, Grab, xe buýt đầy đủ",
    "Trung tâm thương mại, nhà hàng cao cấp",
    "Cộng đồng doanh nhân, chuyên gia",
  ],
  cons: [
    "Giá thuê cực kỳ đắt đỏ",
    "Kẹt xe kinh khủng",
    "Khan hiếm phòng trọ bình dân",
  ],
  target_audience: ["Chuyên gia, quản lý", "Người thu nhập cao", "Expat"],
  streets: [
    {
      name: "Bùi Viện",
      reason:
        "Phố Tây nổi tiếng, cộng đồng du khách và expat đông. Căn hộ và phòng ở khu lân cận giá tương đối phải chăng hơn.",
      amenities: [
        "Hơn 100 quán bar, nhà hàng quốc tế",
        "Gần Bến Thành 1km",
        "Metro Bến Thành",
        "Nhiều hostel, co-working space",
      ],
      price_range: { min: 5, max: 12 },
      types: ["studio", "căn hộ mini", "shared room"],
      target: ["Du khách dài hạn", "Freelancer", "Expat mới đến"],
      pros: ["Sôi động 24/7", "Dịch vụ đa dạng", "Trung tâm di chuyển"],
      cons: ["Rất ồn ào ban đêm", "Giá cao", "Đông khách du lịch"],
    },
    {
      name: "Nguyễn Huệ",
      reason: "Đại lộ đi bộ trung tâm, gần phố tài chính. Lý tưởng cho người làm tài chính-ngân hàng.",
      amenities: [
        "Ngân hàng Nhà Nước, SSI, BIDV gần đó",
        "Nhà hát TP 300m",
        "Landmark 81 view xa",
        "Metro Bến Thành 500m",
      ],
      price_range: { min: 8, max: 20 },
      types: ["căn hộ cao cấp", "studio"],
      target: ["Chuyên gia tài chính", "Quản lý cấp cao"],
      pros: ["Hạ tầng đỉnh cao", "An ninh tốt", "Danh tiếng"],
      cons: ["Cực kỳ đắt", "Kẹt xe nặng"],
    },
  ],
};

const hcm_binhthanh: DistrictKnowledge = {
  district: "Bình Thạnh",
  city: "TP. Hồ Chí Minh",
  aliases: [
    "binh thanh",
    "bình thạnh",
    "q binh thanh",
    "quận bình thạnh",
    "binh thanh hcm",
    "landmark 81",
  ],
  overview:
    "Bình Thạnh là quận sôi động phía Bắc trung tâm HCM, nổi bật với Landmark 81. Nhiều phòng trọ và chung cư mini giá trung bình, phù hợp người đi làm muốn ở gần Q.1.",
  avg_price: { min: 2.5, max: 8 },
  pros: [
    "Gần Quận 1 chỉ 10-15 phút",
    "Nhiều chung cư và phòng trọ đa dạng",
    "Co-working space và cafe nhiều",
    "Gần Landmark 81 - tiện nghi hàng đầu",
  ],
  cons: ["Kẹt xe cầu Sài Gòn giờ cao điểm", "Ngập nước mùa mưa một số tuyến"],
  target_audience: ["Nhân viên văn phòng", "Sinh viên IU, UEL", "Người đi làm Q.1"],
  streets: [
    {
      name: "Xô Viết Nghệ Tĩnh",
      reason:
        "Trục đường chính Bình Thạnh, gần cầu Thị Nghè và cầu Sài Gòn. Nhiều chung cư mini chất lượng tốt.",
      amenities: [
        "Vincom Mega Mall 1km",
        "Big C Bình Thạnh 800m",
        "Nhiều ngân hàng, bệnh viện",
        "Metro số 1 (đang xây dựng)",
      ],
      price_range: { min: 3, max: 7 },
      types: ["chung cư mini", "studio", "căn hộ dịch vụ"],
      target: ["Nhân viên văn phòng", "Cặp vợ chồng trẻ"],
      pros: ["Tiện nghi đầy đủ", "Gần Q.1", "Nhiều siêu thị"],
      cons: ["Kẹt xe cao điểm", "Giá trung bình-cao"],
    },
    {
      name: "Đinh Bộ Lĩnh",
      reason:
        "Khu vực dân cư đông đúc, nhiều phòng trọ giá tốt, tiện ích đầy đủ. Phổ biến với sinh viên và người đi làm bình thường.",
      amenities: [
        "Chợ Bình Thạnh 500m",
        "Trường ĐH Văn Lang gần",
        "Nhiều quán ăn bình dân",
        "Xe buýt đi trung tâm",
      ],
      price_range: { min: 2.5, max: 5 },
      types: ["phòng trọ", "chung cư mini"],
      target: ["Sinh viên", "Công chức", "Người đi làm bình thường"],
      pros: ["Giá vừa phải", "Nhiều ăn uống", "Đi lại thuận tiện"],
      cons: ["Đông đúc", "Ngập nước mùa mưa một số điểm"],
    },
  ],
};

const hcm_govap: DistrictKnowledge = {
  district: "Gò Vấp",
  city: "TP. Hồ Chí Minh",
  aliases: ["go vap", "gò vấp", "q go vap", "quận gò vấp"],
  overview:
    "Gò Vấp là một trong những quận đông dân nhất HCM. Nổi tiếng với giá phòng trọ rẻ, gần nhiều trường đại học (Sư Phạm, Ngoại Thương, Văn Lang). Cộng đồng sinh viên mạnh.",
  avg_price: { min: 1.5, max: 4 },
  pros: [
    "Giá thuê rẻ, nhiều lựa chọn",
    "Gần 5+ trường đại học lớn",
    "Chợ và siêu thị đầy đủ",
    "Cộng đồng sinh viên sôi động",
  ],
  cons: ["Kẹt xe nghiêm trọng đường Quang Trung", "Ngập nước mùa mưa"],
  target_audience: ["Sinh viên", "Người đi làm thu nhập trung bình", "Công nhân"],
  streets: [
    {
      name: "Quang Trung",
      reason:
        "Trục đường huyết mạch Gò Vấp, tập trung phòng trọ sinh viên và cửa hàng. Gần ĐH Sư Phạm và ĐH Ngoại Thương.",
      amenities: [
        "ĐH Sư Phạm HCM 1km",
        "ĐH Ngoại Thương 1.5km",
        "Emart Gò Vấp 2km",
        "Nhiều quán nhậu, cafe sinh viên",
      ],
      price_range: { min: 1.5, max: 3.5 },
      types: ["phòng trọ", "nhà trọ ghép"],
      target: ["Sinh viên Sư Phạm và Ngoại Thương"],
      pros: ["Rất gần trường", "Giá rẻ", "Ăn uống đa dạng"],
      cons: ["Kẹt xe kinh khủng", "Ô nhiễm bụi"],
    },
    {
      name: "Lê Đức Thọ",
      reason:
        "Đường khu dân cư yên tĩnh hơn, gần Vincom Gò Vấp. Phòng mới xây chất lượng tốt hơn.",
      amenities: [
        "Vincom Gò Vấp 800m",
        "BigC Gò Vấp 1km",
        "Nhiều trường học cấp 1-3",
        "Bệnh viện Gò Vấp 2km",
      ],
      price_range: { min: 2, max: 4 },
      types: ["chung cư mini", "phòng trọ", "studio"],
      target: ["Gia đình nhỏ", "Nhân viên văn phòng", "Người đi làm trung tâm"],
      pros: ["Gần Vincom", "Yên tĩnh hơn Quang Trung", "Phòng chất lượng tốt"],
      cons: ["Giá cao hơn trung bình quận"],
    },
  ],
};

const hcm_thuduc: DistrictKnowledge = {
  district: "TP. Thủ Đức",
  city: "TP. Hồ Chí Minh",
  aliases: [
    "thu duc",
    "thủ đức",
    "tp thu duc",
    "thanh pho thu duc",
    "linh trung",
    "thu duc hcm",
    "khu cong nghe cao hcm",
  ],
  overview:
    "TP. Thủ Đức (sáp nhập Q.2, Q.9, Q. Thủ Đức cũ) là thành phố trong thành phố, trung tâm giáo dục-công nghệ phía Đông HCM. Có ĐH Quốc Gia, KCX Linh Trung, làng ĐH.",
  avg_price: { min: 1.5, max: 5 },
  pros: [
    "Tập trung nhiều trường đại học (ĐH Quốc Gia, RMIT, FPT...)",
    "KCX Linh Trung cho công nhân làm gần",
    "Đang phát triển mạnh theo quy hoạch",
    "Nhiều khu đô thị mới hiện đại",
  ],
  cons: ["Xa trung tâm (20-30km)", "Metro số 1 chưa hoàn chỉnh", "Kẹt xe cao tốc giờ cao điểm"],
  target_audience: ["Sinh viên ĐH Quốc Gia", "Công nhân KCX Linh Trung", "Nhân viên IT-công nghệ"],
  streets: [
    {
      name: "Võ Văn Ngân",
      reason:
        "Khu vực làng ĐH Thủ Đức, tập trung phòng trọ sinh viên đông nhất HCM. Gần ĐH Bách Khoa, ĐH Khoa Học Tự Nhiên, ĐH KHXH&NV.",
      amenities: [
        "ĐH Bách Khoa HCM 500m",
        "ĐH Khoa Học Tự Nhiên 300m",
        "ĐH KHXH&NV 700m",
        "Nhiều quán ăn 24/7",
        "Photocopy, nhà sách đầy đủ",
      ],
      price_range: { min: 1.5, max: 3 },
      types: ["phòng trọ", "KTX dân lập", "nhà trọ ghép"],
      target: ["Sinh viên ĐH Quốc Gia HCM"],
      pros: ["Rẻ nhất cho sinh viên HCM", "Cộng đồng sinh viên lớn nhất", "Đủ dịch vụ sinh viên"],
      cons: ["Rất đông, ồn ào", "Phòng thường nhỏ"],
    },
    {
      name: "Tô Vĩnh Diện",
      reason:
        "Khu gần RMIT và FPT University. Phòng trọ và căn hộ chất lượng cao hơn, phù hợp sinh viên quốc tế và có điều kiện.",
      amenities: [
        "RMIT HCM 1km",
        "FPT University 1.5km",
        "Vincom Thủ Đức 2km",
        "Nhiều café và co-working space",
      ],
      price_range: { min: 3, max: 6 },
      types: ["studio", "chung cư mini", "căn hộ cao cấp"],
      target: ["Sinh viên RMIT, FPT", "Nhân viên IT KCX"],
      pros: ["Phòng chất lượng cao", "Gần trường quốc tế", "Môi trường hiện đại"],
      cons: ["Giá cao hơn khu khác", "Xa trung tâm HCM"],
    },
  ],
};

// ============================================================
// HÀ NỘI
// ============================================================

const hanoi_caugiay: DistrictKnowledge = {
  district: "Cầu Giấy",
  city: "Hà Nội",
  aliases: ["cau giay", "cầu giấy", "q cau giay", "quận cầu giấy", "ha noi tay"],
  overview:
    "Cầu Giấy là quận trung tâm giáo dục phía Tây Hà Nội. Tập trung đông đảo sinh viên (ĐH Quốc Gia HN, ĐH Bách Khoa HN) và nhân viên công nghệ Keangnam, Lotte.",
  avg_price: { min: 2, max: 6 },
  pros: [
    "Tập trung nhiều trường ĐH hàng đầu",
    "Keangnam, Lotte, nhiều tòa nhà văn phòng lớn",
    "Hạ tầng tốt, Metro Nhổn-Ga Hà Nội (đang vận hành)",
    "Nhiều siêu thị, TTTM hiện đại",
  ],
  cons: ["Kẹt xe Xuân Thủy, Cầu Giấy", "Giá tăng nhanh theo năm", "Ô nhiễm bụi mùa hanh"],
  target_audience: ["Sinh viên ĐH Quốc Gia HN", "Nhân viên IT-văn phòng", "Gia đình trung lưu"],
  streets: [
    {
      name: "Xuân Thủy",
      reason:
        "Trục đường trung tâm Cầu Giấy, gần ĐH Quốc Gia HN và Keangnam Towers. Phòng trọ và chung cư mini đa dạng.",
      amenities: [
        "ĐH Quốc Gia Hà Nội 800m",
        "Keangnam Hanoi Landmark Tower 1km",
        "TTTM The Garden 1.5km",
        "Siêu thị Big C Thăng Long 2km",
        "Metro ga Cầu Giấy",
      ],
      price_range: { min: 2.5, max: 6 },
      types: ["phòng trọ", "chung cư mini", "studio"],
      target: ["Sinh viên ĐH QG HN", "Nhân viên Keangnam", "Nhân viên IT"],
      pros: ["Gần ĐH Quốc Gia và văn phòng lớn", "Hạ tầng tốt", "Metro thuận tiện"],
      cons: ["Kẹt xe kinh khủng", "Giá phòng tăng cao"],
    },
    {
      name: "Dịch Vọng Hậu",
      reason:
        "Khu dân cư yên tĩnh hơn Xuân Thủy, phòng trọ giá tốt hơn gần khu giáo dục.",
      amenities: [
        "ĐH Sư Phạm HN 1km",
        "Vincom Nguyễn Chí Thanh 2km",
        "Nhiều trường cấp 2-3 chất lượng",
        "Chợ Nghĩa Tân gần",
      ],
      price_range: { min: 2, max: 4.5 },
      types: ["phòng trọ", "nhà trong ngõ"],
      target: ["Sinh viên Sư Phạm", "Gia đình có con đi học"],
      pros: ["Yên tĩnh hơn", "Gần nhiều trường tốt", "Giá hợp lý"],
      cons: ["Ngõ nhỏ xe ô tô vào khó"],
    },
  ],
};

const hanoi_dongda: DistrictKnowledge = {
  district: "Đống Đa",
  city: "Hà Nội",
  aliases: ["dong da", "đống đa", "q dong da", "quận đống đa", "ha noi trung tam"],
  overview:
    "Đống Đa là quận trung tâm lịch sử Hà Nội, đông dân và có mật độ phòng trọ cao. Gần Hồ Tây, Văn Miếu, nhiều trường đại học. Chi phí trung bình.",
  avg_price: { min: 2, max: 5.5 },
  pros: [
    "Trung tâm Hà Nội, tiện di chuyển",
    "Gần Bệnh viện Bạch Mai và nhiều bệnh viện lớn",
    "Nhiều phòng trọ trong ngõ giá tốt",
    "Văn hóa-lịch sử phong phú",
  ],
  cons: ["Khu dân cư cũ, phòng trọ đôi khi xuống cấp", "Kẹt xe nội đô", "Ngập nước mùa mưa"],
  target_audience: ["Sinh viên", "Nhân viên bệnh viện", "Công chức các bộ ngành"],
  streets: [
    {
      name: "Tôn Đức Thắng",
      reason:
        "Gần ĐH Xây Dựng, ĐH Giao Thông Vận Tải và Văn Miếu. Phòng trọ trong ngõ giá phải chăng.",
      amenities: [
        "ĐH Xây Dựng 800m",
        "Văn Miếu - Quốc Tử Giám 500m",
        "Bệnh viện Bạch Mai 2km",
        "Trung tâm xe buýt Hà Nội",
      ],
      price_range: { min: 2, max: 4 },
      types: ["phòng trọ trong ngõ", "nhà trọ"],
      target: ["Sinh viên Xây Dựng, Giao Thông", "Nhân chức văn phòng Q. Đống Đa"],
      pros: ["Gần trường và bệnh viện", "Giá vừa phải", "Nhiều lịch sử văn hóa"],
      cons: ["Ngõ nhỏ, khó đi ô tô", "Phòng trọ cũ"],
    },
    {
      name: "Nguyễn Lương Bằng",
      reason: "Khu vực gần Bệnh viện Bạch Mai, nhiều nhân viên y tế và sinh viên y thuê.",
      amenities: [
        "Bệnh viện Bạch Mai 300m",
        "ĐH Y Hà Nội 1km",
        "Nhiều quán ăn đêm",
        "Siêu thị tiện lợi",
      ],
      price_range: { min: 2, max: 4.5 },
      types: ["phòng trọ", "chung cư mini"],
      target: ["Sinh viên Y", "Nhân viên bệnh viện Bạch Mai"],
      pros: ["Gần bệnh viện lớn nhất HN", "Tiện nghi đầy đủ", "Đa dạng lựa chọn"],
      cons: ["Ồn ào khu vực bệnh viện", "Đôi khi thiếu chỗ đỗ xe"],
    },
  ],
};

const hanoi_hoangmai: DistrictKnowledge = {
  district: "Hoàng Mai",
  city: "Hà Nội",
  aliases: ["hoang mai", "hoàng mai", "q hoang mai", "quận hoàng mai", "ha noi nam"],
  overview:
    "Hoàng Mai là quận phía Nam đang phát triển mạnh của Hà Nội. Nhiều khu đô thị mới (Times City, Vinhomes), phòng ốc hiện đại, giá trung bình-thấp so với nội đô.",
  avg_price: { min: 1.8, max: 5 },
  pros: [
    "Nhiều khu đô thị mới, phòng hiện đại",
    "Giá thấp hơn nội thành",
    "Kết nối metro trong tương lai",
    "Không khí thoáng hơn trung tâm",
  ],
  cons: ["Xa trung tâm (7-15km từ Hoàn Kiếm)", "Đường vành đai đôi khi tắc"],
  target_audience: ["Gia đình trẻ", "Người đi làm KCN phía Nam", "Người muốn ở mới, rộng hơn"],
  streets: [
    {
      name: "Giải Phóng",
      reason:
        "Trục đường chính nối nội đô với Hoàng Mai. Gần Times City và Big C Thăng Long. Phòng trọ và chung cư mini đa dạng.",
      amenities: [
        "Times City 1km",
        "Big C Thăng Long 1.5km",
        "Bến xe Giáp Bát 2km",
        "Nhiều siêu thị, nhà hàng",
        "Metro (dự kiến)",
      ],
      price_range: { min: 2, max: 5 },
      types: ["chung cư mini", "phòng trọ", "studio"],
      target: ["Nhân viên văn phòng", "Gia đình trẻ"],
      pros: ["Gần Times City tiện nghi", "Đường lớn đi lại dễ", "Hạ tầng tốt"],
      cons: ["Khoảng cách xa trung tâm"],
    },
    {
      name: "Tam Trinh",
      reason: "Khu dân cư đông đúc, nhiều phòng trọ giá rẻ. Gần KCN Vĩnh Tuy và nhiều nhà máy.",
      amenities: [
        "KCN Vĩnh Tuy 2km",
        "Chợ Thịnh Liệt gần",
        "Xe buýt đi trung tâm",
        "Nhiều quán ăn bình dân",
      ],
      price_range: { min: 1.8, max: 3.5 },
      types: ["phòng trọ", "nhà trọ"],
      target: ["Công nhân KCN", "Người đi làm tiết kiệm"],
      pros: ["Giá rẻ", "Gần KCN Vĩnh Tuy", "Nhiều lựa chọn"],
      cons: ["Hạ tầng chưa đồng đều", "Ngập nước một số điểm"],
    },
  ],
};

// ============================================================
// EXPORTS — KNOWLEDGE BASE TỔNG HỢP
// ============================================================

export const KNOWLEDGE_BASE: DistrictKnowledge[] = [
  // Đà Nẵng
  danang_haichau,
  danang_thanhkhe,
  danang_sontra,
  danang_nguhanson,
  danang_lienchieu,
  // TP. Hồ Chí Minh
  hcm_quan1,
  hcm_binhthanh,
  hcm_govap,
  hcm_thuduc,
  // Hà Nội
  hanoi_caugiay,
  hanoi_dongda,
  hanoi_hoangmai,
];
