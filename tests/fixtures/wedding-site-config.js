/**
 * config.js — TOÀN BỘ nội dung + cấu hình của thiệp cưới.
 *
 * Đây là file duy nhất bạn cần sửa để đổi nội dung (tên, ngày giờ, địa điểm,
 * ảnh, hiệu ứng...). Không cần chạy fetch/server để đọc file này — nó được
 * nạp trực tiếp như một file .js bình thường của project, nên mở thẳng
 * index.html bằng cách double-click cũng chạy được (không bị chặn CORS).
 *
 * Lưu ý cú pháp: đây là JS object literal (gần giống JSON) — khi sửa tay,
 * đừng để dấu phẩy dư ở phần tử cuối cùng của mỗi mảng/object.
 */
window.WEDDING_CONFIG = {
  "theme": "tram-vang",

  "site": {
    "title": "Minh Anh & Thuỳ Linh · 12.12.2026",
    "canonicalUrl": "https://vidu.vn/thiep/minh-anh-thuy-linh",
    "metaDescription": "Trân trọng kính mời bạn đến chung vui ngày trọng đại của chúng tôi. Tổ chức ngày 12 tháng 12, 2026.",
    "ogImage": "images/og/og.jpg",
    "locale": "vi_VN",
    "favicon": "images/og/og.jpg"
  },
  "invitation": {
    "eyebrow": "Thiệp mời cưới · 12.12.2026",
    "kicker": "Save the Date",
    "weekday": "Thứ Bảy",
    "day": "12",
    "month": "Tháng 12",
    "year": "2026",
    "lunarDate": "Tức ngày 3 tháng 11 năm Bính Ngọ",
    "guestName": "Quý khách",
    "tapToOpenLabel": "Chạm để mở thiệp",
    "openedGreeting": "Chúng mình sắp cưới!",
    "openedSubline": "Hai con người, một câu chuyện —\nvà một lời hẹn trọn đời.",
    "guestNameFromUrl": true,
    "guestUrlPathPrefix": "invite",
    "guestUrlParam": "to",
    "guestNameTemplate": "{name}"
  },
  "couple": {
    "groom": {
      "label": "Groom",
      "labelVi": "Chú rể",
      "fullName": "Nguyễn Minh Anh",
      "shortName": "Minh Anh",
      "photo": "images/couple/groom.jpg",
      "bio": "Con trai của ông Nguyễn Văn Bình và bà Lê Thị Hoa"
    },
    "bride": {
      "label": "Bride",
      "labelVi": "Cô dâu",
      "fullName": "Trần Thuỳ Linh",
      "shortName": "Thuỳ Linh",
      "photo": "images/couple/bride.jpg",
      "bio": "Con gái của ông Trần Văn Long và bà Phạm Thị Mai"
    },
    "monogram": "M & L"
  },
  "families": {
    "groomFamily": {
      "title": "Nhà Trai",
      "photo": "images/families/groom-family.jpg",
      "parentsLabel": "Ông bà",
      "father": "Nguyễn Văn Bình",
      "mother": "Lê Thị Hoa",
      "address": "Số 12 Ngõ 88, Ba Đình, Hà Nội"
    },
    "brideFamily": {
      "title": "Nhà Gái",
      "photo": "images/families/bride-family.jpg",
      "parentsLabel": "Ông bà",
      "father": "Trần Văn Long",
      "mother": "Phạm Thị Mai",
      "address": "Số 45 Đường Láng, Đống Đa, Hà Nội"
    }
  },
  "announcement": {
    "heading": "Trân trọng báo tin",
    "subheading": "Lễ Thành Hôn của con chúng tôi"
  },
  "events": [
    {
      "id": "an-hoi",
      "name": "Lễ Ăn Hỏi",
      "date": "2026-12-10",
      "displayDate": "Thứ Năm 10 Tháng 12 · 2026",
      "lunarDate": "Tức ngày 1 tháng 11 năm Bính Ngọ",
      "welcomeTime": "08:00",
      "startTime": "08:30",
      "venueName": "Tư Gia Nhà Gái",
      "address": "Số 45 Đường Láng, Đống Đa, Hà Nội",
      "mapUrl": "https://www.google.com/maps?q=21.0186,105.8107",
      "rsvpEnabled": true
    },
    {
      "id": "thanh-hon",
      "name": "Lễ Thành Hôn",
      "date": "2026-12-12",
      "displayDate": "Thứ Bảy 12 Tháng 12 · 2026",
      "lunarDate": "Tức ngày 3 tháng 11 năm Bính Ngọ",
      "welcomeTime": "11:00",
      "startTime": "11:30",
      "venueName": "Trung Tâm Tiệc Cưới Hoa Cưới",
      "address": "Số 200 Trần Duy Hưng, Cầu Giấy, Hà Nội",
      "mapUrl": "https://www.google.com/maps?q=21.0091,105.7889",
      "rsvpEnabled": true
    }
  ],
  "timeline": [
    {
      "label": "Lễ Ăn Hỏi tại Tư gia Nhà gái",
      "time": "08:30",
      "date": "Ngày 10 tháng 12"
    },
    {
      "label": "Lễ Thành Hôn tại Trung Tâm Tiệc Cưới",
      "time": "11:30",
      "date": "Ngày 12 tháng 12"
    }
  ],
  "album": {
    "folder": "images/album",
    "images": [
      "images/album/01.jpg",
      "images/album/02.jpg",
      "images/album/03.jpg",
      "images/album/04.jpg",
      "images/album/05.jpg",
      "images/album/06.jpg",
      "images/album/07.jpg",
      "images/album/08.jpg"
    ]
  },
  "cover": {
    "image": "images/cover/cover.jpg",
    "caption": "Nguyễn Minh Anh & Trần Thuỳ Linh"
  },
  "gift": {
    "heading": "Mừng Cưới",
    "message": "Sự hiện diện của quý khách là món quà quý giá nhất",
    "showBankInfo": false,
    "bankAccounts": [
      {
        "owner": "Nguyễn Minh Anh",
        "bank": "Vietcombank",
        "accountNumber": "0123456789"
      },
      {
        "owner": "Trần Thuỳ Linh",
        "bank": "Techcombank",
        "accountNumber": "9876543210"
      }
    ]
  },
  "guestbook": {
    "heading": "Sổ Lưu Bút",
    "subheading": "Để lại đôi lời thân thương cho cô dâu chú rể",
    "storageKey": "wedding_guestbook_v1",
    "mode": "local",
    "apiUrl": "",
    "pollIntervalSeconds": 20,
    "seedMessages": [
      {
        "name": "ThiepMoiCuoi",
        "message": "Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui!",
        "time": "3 tuần trước"
      },
      {
        "name": "Bạn thân",
        "message": "Chúc mừng đám cưới, chúc hai bạn mãi bên nhau!",
        "time": "2 tuần trước"
      }
    ]
  },
  "rsvp": {
    "heading": "Xác nhận tham dự",
    "subheading": "Hai chúng tôi sẽ vui hơn rất nhiều nếu bạn xác nhận trước",
    "storageKey": "wedding_rsvp_v1",
    "attendingLabel": "Tôi sẽ đến",
    "notAttendingLabel": "Rất tiếc, tôi không thể đến",
    "guestCountLabel": "Bạn đi mấy người?"
  },
  "countdown": {
    "targetDate": "2026-12-12T11:30:00+07:00",
    "todayLabel": "Hôm nay là ngày trọng đại!",
    "heading": "Đếm Ngược Ngày"
  },
  "thankYou": {
    "heading": "Trân trọng cảm ơn",
    "message": "Sự hiện diện và lời chúc của quý khách là niềm vinh hạnh lớn lao, kỷ niệm khó quên trong ngày trọng đại của chúng tôi.",
    "signature": "Minh Anh & Thuỳ Linh"
  },
  "vendor": {
    "show": true,
    "name": "Thiệp Cưới Của Bạn",
    "tagline": "Uy tín · Chất lượng",
    "phone": "0900000000",
    "logo": "images/og/og.jpg"
  },
  "music": {
    "enabled": true,
    "src": "assets/audio/wedding-song.mp3",
    "autoplayAfterOpen": true,
    "title": "Beautiful In White"
  },
  "effects": {
    "petals": {
      "enabled": true,
      "types": ["petal", "heart"],
      "density": 18,
      "colors": [
        "#e8c9c2",
        "#caa6a0",
        "#f3e3d3"
      ]
    },
    "scrollReveal": {
      "enabled": true,
      "distance": 24,
      "duration": 700
    },
    "coverUnlock": {
      "enabled": true,
      "unlockAnimation": "fade-zoom"
    },
    "autoScroll": {
      "enabled": true,
      "speed": 55,
      "startDelayMs": 650
    }
  },
  "sections": {
    "order": [
      "hero",
      "couple",
      "families",
      "announcement",
      "events",
      "album",
      "timeline",
      "guestbook",
      "gift",
      "countdown",
      "thankyou",
      "rsvp"
    ]
  }
};
