import os, json
from io import BytesIO
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont
from catalog.models import Category, Brand, District, Product, ProductImage, ProductVariant, ProductSpecification, ProductFAQ, ProductReview
from storefront.models import PromoBanner, SiteSetting

PRODUCTS = [
  {
    "title": "110-in-1 Magnetic Professional Screwdriver Tool Kit | DIY & Computer Repair",
    "slug": "professional-screwdriver-tool-kit", "model_number": "KS-840110-1",
    "price": 999, "original_price": 1850, "section_type": "hot", "in_stock": True,
    "category_key": "tools",
    "short_description": "110-in-1 ম্যাগনেটিক স্ক্রু ড্রাইভার সেট পেশাদার ও DIY কাজের জন্য আদর্শ।",
    "images_count": 4, "image_path": "screw",
    "variants": [{"name":"color","value":"Red","price_modifier":0}],
    "specs": [{"label":"মডেল","value":"KS-840110-1"},{"label":"ম্যাগনেটিক","value":"হ্যাঁ"},{"label":"পিস সংখ্যা","value":"১১০"},{"label":"ম্যাটেরিয়াল","value":"ক্রোম ভ্যানাডিয়াম স্টিল"}],
    "faqs": [{"question":"গ্যারান্টি কতদিন?","answer":"১ বছরের গ্যারান্টি।"},{"question":"কি কি টুলস আছে?","answer":"স্ক্রু ড্রাইভার, হেক্স কি, সকেট, বিটস এবং আরও অনেক কিছু।"}],
    "reviews": [{"reviewer_name":"রাশেদ","rating":5,"comment":"দারুণ কোয়ালিটি। সব টুলস খুব ভালো।"}]
  },
  {
    "title": "ProShave Triple-Blade Full-Body Electric Shaver | IPX7 Waterproof | USB Type-C Rechargeable",
    "slug": "portable-mini-home-shaver", "model_number": "TXD019",
    "price": 1450, "original_price": 1680, "section_type": "hot", "in_stock": True,
    "category_key": "personal-care",
    "short_description": "পোর্টেবল মিনি হোম শেভার ট্রিপল ব্লেড ফয়েল টেকনোলজি ব্যবহার করে মুখ, শরীর ও আন্ডারআর্মের চুল মসৃণভাবে কাটতে সক্ষম।",
    "images_count": 6, "image_path": "shaver",
    "variants": [{"name":"color","value":"Black","price_modifier":0}],
    "specs": [{"label":"মডেল","value":"TXD019"},{"label":"ওয়াটারপ্রুফ","value":"IPX7"},{"label":"চার্জিং","value":"USB Type-C"},{"label":"ব্যাটারি","value":"লিথিয়াম-আয়ন"}],
    "faqs": [{"question":"ওয়াটারপ্রুফ কি?","answer":"হ্যাঁ, IPX7 ওয়াটারপ্রুফ।"},{"question":"চার্জিং ক্যাবল আছে?","answer":"USB Type-C ক্যাবল সহ আসে।"}],
    "reviews": [{"reviewer_name":"করিম","rating":5,"comment":"ভালো প্রোডাক্ট। শেভিং খুব ক্লিন হয়।"}]
  },
  {
    "title": "3D Human Body Torso Model for Kids | Learn Anatomy | Kino Mart",
    "slug": "3d-human-body-torso-model-for-kids", "model_number": "Standard",
    "price": 850, "original_price": 1250, "section_type": "hot", "in_stock": True,
    "category_key": "toys",
    "short_description": "3D হিউম্যান বডি টর্সো মডেল শিশুদের জন্য বিশেষভাবে তৈরি একটি শিক্ষামূলক খেলনা।",
    "images_count": 3, "image_path": "anatomy",
    "variants": [],
    "specs": [{"label":"উপাদান","value":"প্লাস্টিক"},{"label":"বয়স","value":"৩+"},{"label":"অংশ সংখ্যা","value":"১০+"}],
    "faqs": [{"question":"কি কি অংশ আছে?","answer":"মস্তিষ্ক, হৃদয়, ফুসফুস, পাকস্থলী, লিভার এবং আরও অনেক কিছু।"}],
    "reviews": [{"reviewer_name":"সাদিয়া","rating":5,"comment":"বাচ্চার জন্য দারুণ শিক্ষামূলক খেলনা।"}]
  },
  {
    "title": "Energy Booster Essential Oil Nasal Inhaler | Kino Mart",
    "slug": "energy-booster-essential-oil-nasal-inhaler", "model_number": "Standard",
    "price": 490, "original_price": 650, "section_type": "hot", "in_stock": True,
    "category_key": "health",
    "short_description": "এসেনশিয়াল অয়েল সমৃদ্ধ ইনহেলার প্রাকৃতিকভাবে সাইনাসের অস্বস্তি কমাতে সহায়তা করে।",
    "images_count": 3, "image_path": "inhaler",
    "variants": [{"name":"type","value":"Mint","price_modifier":0},{"name":"type","value":"Grape","price_modifier":0},{"name":"type","value":"Watermelon","price_modifier":0},{"name":"type","value":"Peace","price_modifier":0},{"name":"type","value":"Lemon","price_modifier":0},{"name":"type","value":"RedBull","price_modifier":0}],
    "specs": [{"label":"টাইপ","value":"নাসাল ইনহেলার"},{"label":"উপাদান","value":"এসেনশিয়াল অয়েল"},{"label":"ব্যবহার","value":"সাইনাস ও শ্বাস-প্রশ্বাস"}],
    "faqs": [{"question":"কতদিন ব্যবহার করা যায়?","answer":"প্রতিটি ইনহেলার ১ মাস পর্যন্ত ব্যবহার করা যায়।"}],
    "reviews": [{"reviewer_name":"নাসির","rating":4,"comment":"ভালো কাজ করে। ঠান্ডা লাগলে আরাম দেয়।"}]
  },
  {
    "title": "Portable Electric Dental Water Flosser",
    "slug": "portable-electric-dental-water-flosser", "model_number": "Standard",
    "price": 1650, "original_price": 2150, "section_type": "hot", "in_stock": True,
    "category_key": "personal-care",
    "short_description": "৮০-১২০ PSI ওয়াটার প্রেসার সহ গভীর ক্লিনিং।",
    "images_count": 4, "image_path": "flosser",
    "variants": [{"name":"color","value":"White","price_modifier":0}],
    "specs": [{"label":"ওয়াটার প্রেসার","value":"৮০-১২০ PSI"},{"label":"ট্যাংক ক্যাপাসিটি","value":"২০০ml"},{"label":"চার্জিং","value":"USB"}],
    "faqs": [{"question":"জল দিয়ে ব্যবহার করা যায়?","answer":"হ্যাঁ, নরমাল পানি ব্যবহার করুন।"}],
    "reviews": [{"reviewer_name":"রাবেয়া","rating":5,"comment":"দাঁতের যত্নের জন্য দারুণ প্রোডাক্ট।"}]
  },
  {
    "title": "6000mAh-Portable Baby feeding Bottle Warmer",
    "slug": "portable-baby-feeding-bottle-warmer", "model_number": "Black",
    "price": 1990, "original_price": 2650, "section_type": "hot", "in_stock": True,
    "category_key": "baby",
    "short_description": "পোর্টেবল বেবি ফিডিং বটল ওয়ার্মার যা আপনার শিশুর দুধ বা খাবারকে নিরাপদ তাপমাত্রায় গরম রাখে।",
    "images_count": 4, "image_path": "warmer",
    "variants": [{"name":"color","value":"6000 mAh","price_modifier":0}],
    "specs": [{"label":"ক্যাপাসিটি","value":"৬০০০ mAh"},{"label":"উপাদান","value":"BPA-ফ্রি প্লাস্টিক"}],
    "faqs": [{"question":"কত তাপমাত্রা পর্যন্ত গরম হয়?","answer":"৩৭°C - ৫০°C পর্যন্ত কন্ট্রোল করা যায়।"}],
    "reviews": [{"reviewer_name":"তাহমিনা","rating":5,"comment":"বেবির জন্য পারফেক্ট। খুব ইউজফুল।"}]
  },
  {
    "title": "20W, 35w, 45w, 65w Universal Travel Adapter",
    "slug": "universal-travel-adapter", "model_number": "Black",
    "price": 1290, "original_price": 1550, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "২০-৬৫ ওয়াট ইউনিভার্সাল ট্রাভেল অ্যাডাপ্টর যেটি আপনার যেকোনো ডিভাইস চার্জিং এর জন্য পারফেক্ট সলিউশন।",
    "images_count": 4, "image_path": "adapter",
    "variants": [{"name":"type","value":"20W","price_modifier":0},{"name":"type","value":"35W","price_modifier":0},{"name":"type","value":"45W","price_modifier":0},{"name":"type","value":"65W","price_modifier":0}],
    "specs": [{"label":"ওয়াট","value":"২০-৬৫W"},{"label":"ইউএসবি পোর্ট","value":"USB-C + USB-A"}],
    "faqs": [{"question":"কোন দেশে কাজ করে?","answer":"বিশ্বের ১৫০+ দেশে কাজ করে।"}],
    "reviews": [{"reviewer_name":"ইমন","rating":5,"comment":"ট্রাভেলের জন্য দারুণ।"}]
  },
  {
    "title": "20W Universal Travel Adapter",
    "slug": "20w-universal-travel-adapter", "model_number": "Black",
    "price": 1290, "original_price": 1550, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "২০ ওয়াট ইউনিভার্সাল ট্রাভেল অ্যাডাপ্টর।",
    "images_count": 4, "image_path": "adapter",
    "variants": [{"name":"type","value":"20W","price_modifier":0}],
    "specs": [{"label":"ওয়াট","value":"২০W"},{"label":"ইউএসবি পোর্ট","value":"USB-C + USB-A"}],
    "faqs": [{"question":"কোন দেশে কাজ করে?","answer":"বিশ্বের ১৫০+ দেশে কাজ করে।"}],
    "reviews": [{"reviewer_name":"আরিফ","rating":4,"comment":"ভালো মানের অ্যাডাপ্টর।"}]
  },
  {
    "title": "35W Universal Travel Adapter",
    "slug": "35w-universal-travel-adapter", "model_number": "Black",
    "price": 1650, "original_price": 1850, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "৩৫ ওয়াট ইউনিভার্সাল ট্রাভেল অ্যাডাপ্টর।",
    "images_count": 4, "image_path": "adapter",
    "variants": [{"name":"type","value":"35W","price_modifier":0}],
    "specs": [{"label":"ওয়াট","value":"৩৫W"}],
    "faqs": [],
    "reviews": []
  },
  {
    "title": "45W Universal Travel Adapter",
    "slug": "45w-universal-travel-adapter", "model_number": "Black",
    "price": 1799, "original_price": 2050, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "৪৫ ওয়াট ইউনিভার্সাল ট্রাভেল অ্যাডাপ্টর।",
    "images_count": 4, "image_path": "adapter",
    "variants": [{"name":"type","value":"45W","price_modifier":0}],
    "specs": [{"label":"ওয়াট","value":"৪৫W"}],
    "faqs": [],
    "reviews": []
  },
  {
    "title": "65W Universal Travel Adapter",
    "slug": "65w-universal-travel-adapter", "model_number": "Black",
    "price": 2499, "original_price": 2900, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "৬৫ ওয়াট ইউনিভার্সাল ট্রাভেল অ্যাডাপ্টর।",
    "images_count": 4, "image_path": "adapter",
    "variants": [{"name":"type","value":"65W","price_modifier":0}],
    "specs": [{"label":"ওয়াট","value":"৬৫W"}],
    "faqs": [],
    "reviews": []
  },
  {
    "title": "Adjustable Polarized Sunglass",
    "slug": "adjustable-tint-polarized-sunglass", "model_number": "Black",
    "price": 1350, "original_price": 1850, "section_type": "hot", "in_stock": True,
    "category_key": "fashion",
    "short_description": "১-৯ বিভিন্ন লেভেলে আপনার সুবিধা অনুযায়ী এডজাস্ট করুন।",
    "images_count": 4, "image_path": "glass",
    "variants": [{"name":"color","value":"Black","price_modifier":0},{"name":"color","value":"Silver","price_modifier":0},{"name":"color","value":"Golden","price_modifier":0}],
    "specs": [{"label":"টিন্ট","value":"এডজাস্টেবল ১-৯ লেভেল"},{"label":"ফিচার","value":"পোলারাইজড + UV সুরক্ষা"}],
    "faqs": [{"question":"লেন্স কি পোলারাইজড?","answer":"হ্যাঁ, পোলারাইজড লেন্স।"},{"question":"UV সুরক্ষা আছে?","answer":"হ্যাঁ, 100% UV সুরক্ষা।"}],
    "reviews": [{"reviewer_name":"সুমন","rating":5,"comment":"টিন্ট এডজাস্ট করা যায়, দারুণ প্রোডাক্ট।"}]
  },
  {
    "title": "JF132-Portable High-speed Cooling Fan",
    "slug": "portable-high-speed-cooling-fan", "model_number": "JF132",
    "price": 1599, "original_price": 2250, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "JF132 Portable High-speed Cooling Fan with 0-200 Speed Settings.",
    "images_count": 4, "image_path": "fan",
    "variants": [{"name":"color","value":"Black","price_modifier":0},{"name":"color","value":"White","price_modifier":0},{"name":"color","value":"Mistyrose","price_modifier":0},{"name":"color","value":"Cornflowerblue","price_modifier":0}],
    "specs": [{"label":"মডেল","value":"JF132"},{"label":"স্পীড","value":"০-২০০ সেটিংস"},{"label":"ব্যাটারি","value":"৪০০০mAh"}],
    "faqs": [{"question":"কত ঘন্টা চলে?","answer":"ফুল চার্জে ৪-৮ ঘন্টা।"}],
    "reviews": [{"reviewer_name":"নাদিম","rating":5,"comment":"দারুণ কুলিং ফ্যান। স্পীড কন্ট্রোল সুপার।"}]
  },
  {
    "title": "Borofone BC101 Android/iOS Anti Lost Tracker",
    "slug": "borofone-anti-lost-tracker", "model_number": "BC101",
    "price": 850, "original_price": 1150, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "বোরোফোন BC101 অ্যান্টি লস্ট ট্র্যাকার যা আপনার মূল্যবান জিনিসপত্র হারানো রোধ করে।",
    "images_count": 4, "image_path": "tracker",
    "variants": [{"name":"type","value":"Android","price_modifier":0},{"name":"type","value":"iOS","price_modifier":0}],
    "specs": [{"label":"মডেল","value":"BC101"},{"label":"রেঞ্জ","value":"১০ মিটার"},{"label":"বattery","value":"CR2032"}],
    "faqs": [{"question":"কি কাজ করে?","answer":"কী, ওয়ালেট, ব্যাগ ইত্যাদির সাথে সংযুক্ত করে রাখুন এবং ফোন দিয়ে সার্চ করুন।"}],
    "reviews": [{"reviewer_name":"জাহিদ","rating":5,"comment":"কী হারানো বন্ধ হবে এখন! খুব দরকারি জিনিস।"}]
  },
  {
    "title": "GT4 Pro Smart Watch | Bluetooth Call | Health Monitor",
    "slug": "gt4-pro-smart-watch", "model_number": "GT4-Pro",
    "price": 2490, "original_price": 3590, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "জিটি৪ প্রো স্মার্ট ওয়াচ ব্লুটুথ কল, হার্ট রেট ও ব্লাড প্রেসার মনিটরিং সহ আধুনিক ফিচারে ভরপুর।",
    "images_count": 4, "image_path": "watch",
    "variants": [{"name":"color","value":"Black","price_modifier":0},{"name":"color","value":"Silver","price_modifier":0},{"name":"color","value":"Gold","price_modifier":0}],
    "specs": [{"label":"মডেল","value":"GT4 Pro"},{"label":"ব্লুটুথ","value":"৫.০"},{"label":"স্ক্রিন","value":"১.৯৩ ইঞ্চি AMOLED"},{"label":"বattery","value":"৩০০mAh"}],
    "faqs": [{"question":"কত দিন ব্যাটারি চলে?","answer":"নরমাল ইউজে ৫-৭ দিন।"}],
    "reviews": [{"reviewer_name":"রাজু","rating":5,"comment":"দামে কম কিন্তু ফিচারে অনেক। ভালো প্রোডাক্ট।"}]
  },
  {
    "title": "Hoco/Borofone Android/iOS Anti Lost Tracker",
    "slug": "anti-lost-tracker", "model_number": "E96A/BC101",
    "price": 990, "original_price": 1290, "section_type": "hot", "in_stock": True,
    "category_key": "electronics",
    "short_description": "Hoco E96A Smart Finder হলো একটি স্মার্ট ও আধুনিক সলিউশন।",
    "images_count": 4, "image_path": "tracker",
    "variants": [{"name":"type","value":"Android","price_modifier":0},{"name":"type","value":"iOS","price_modifier":0}],
    "specs": [{"label":"মডেল","value":"E96A"},{"label":"রেঞ্জ","value":"১০ মিটার"}],
    "faqs": [],
    "reviews": []
  },
]

CATEGORIES = [
  {"name": "Electronics", "slug": "electronics", "order": 1},
  {"name": "Personal Care", "slug": "personal-care", "order": 2},
  {"name": "Health & Wellness", "slug": "health", "order": 3},
  {"name": "Baby Products", "slug": "baby", "order": 4},
  {"name": "Fashion Accessories", "slug": "fashion", "order": 5},
  {"name": "Tools & DIY", "slug": "tools", "order": 6},
  {"name": "Toys & Education", "slug": "toys", "order": 7},
]

BRANDS = [
  {"name": "Hoco", "order": 1},
  {"name": "Borofone", "order": 2},
  {"name": "ProShave", "order": 3},
  {"name": "JF Tech", "order": 4},
  {"name": "Kino Mart", "order": 5},
]

COLORS = ["#4A90D9","#E74C3C","#2ECC71","#F39C12","#9B59B6","#1ABC9C","#34495E","#E67E22","#7F8C8D","#C0392B","#2980B9","#27AE60","#8E44AD","#D35400","#16A085"]

def make_placeholder(draw, size, text, color):
    font = None
    try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    except: font = ImageFont.load_default()
    bbox = draw.textbbox((0,0), text, font=font)
    tx = (size[0] - (bbox[2]-bbox[0])) // 2
    ty = (size[1] - (bbox[3]-bbox[1])) // 2
    draw.text((tx, ty), text, fill="white", font=font)

def create_placeholder_images(product, color_idx):
    color = COLORS[color_idx % len(COLORS)]
    path = os.path.join(settings.MEDIA_ROOT, "products", product["image_path"])
    os.makedirs(path, exist_ok=True)
    files = []
    for i in range(product["images_count"]):
        fname = f"img_{i+1}.png"
        fpath = os.path.join(path, fname)
        if not os.path.exists(fpath):
            img = Image.new("RGB", (600,600), color)
            draw = ImageDraw.Draw(img)
            make_placeholder(draw, (600,600), product["slug"][:20], color)
            img.save(fpath)
        files.append(f"products/{product['image_path']}/{fname}")
    return files

class Command(BaseCommand):
    help = "Seed database with products, categories, brands, and districts"

    def add_arguments(self, parser):
        parser.add_argument('--districts', type=str, help='Path to districts JSON file')

    def handle(self, *args, **options):
        media_root = settings.MEDIA_ROOT
        os.makedirs(media_root, exist_ok=True)

        SiteSetting.objects.get_or_create(pk=1,
            defaults={"default_shipping_charge": 60, "site_name": "Kino Mart"}
        )

        cat_map = {}
        for c in CATEGORIES:
            obj, _ = Category.objects.get_or_create(slug=c["slug"], defaults={"name": c["name"], "order": c["order"]})
            cat_map[c["slug"]] = obj
        self.stdout.write(f"Created {len(CATEGORIES)} categories")

        for b in BRANDS:
            Brand.objects.get_or_create(name=b["name"], defaults={"order": b["order"]})
        self.stdout.write(f"Created {len(BRANDS)} brands")

        districts_path = options.get("districts")
        if districts_path and os.path.exists(districts_path):
            with open(districts_path) as f:
                data = json.load(f)
            districts_data = data if isinstance(data, list) else data.get("districts", [])
            for d in districts_data:
                District.objects.get_or_create(
                    name=d.get("name","").strip(),
                    defaults={
                        "bn_name": d.get("bn_name",""),
                        "division_id": d.get("division_id",""),
                        "lat": d.get("lat",""),
                        "long": d.get("long",""),
                        "shipping_charge": 60,
                    }
                )
            self.stdout.write(f"Created {District.objects.count()} districts")
        else:
            standard_districts = [
                "Dhaka","Faridpur","Gazipur","Gopalganj","Jamalpur","Kishoreganj","Madaripur","Manikganj","Munshiganj","Mymensingh",
                "Narayanganj","Narsingdi","Netrokona","Rajbari","Shariatpur","Sherpur","Tangail","Bogra","Joypurhat","Naogaon",
                "Natore","Nawabganj","Pabna","Rajshahi","Sirajganj","Dinajpur","Gaibandha","Kurigram","Lalmonirhat","Nilphamari",
                "Panchagarh","Rangpur","Thakurgaon","Barguna","Barisal","Bhola","Jhalokati","Patuakhali","Pirojpur","Bandarban",
                "Brahmanbaria","Chandpur","Chittagong","Comilla","Coxsbazar","Feni","Khagrachari","Lakshmipur","Noakhali","Rangamati",
                "Habiganj","Moulvibazar","Sunamganj","Sylhet","Bagerhat","Chuadanga","Jessore","Jhenaidah","Khulna","Kushtia",
                "Magura","Meherpur","Narail","Satkhira",
            ]
            for name in standard_districts:
                District.objects.get_or_create(name=name, defaults={"shipping_charge": 60})
            self.stdout.write(f"Created {District.objects.count()} districts")

        product_count = 0
        for pd in PRODUCTS:
            if Product.objects.filter(slug=pd["slug"]).exists():
                self.stdout.write(f"Skipping existing: {pd['slug']}")
                continue
            color = COLORS[product_count % len(COLORS)]
            image_files = create_placeholder_images(pd, product_count)

            product = Product(
                title=pd["title"], slug=pd["slug"],
                model_number=pd.get("model_number",""),
                price=pd["price"],
                original_price=pd.get("original_price"),
                section_type=pd["section_type"], in_stock=pd["in_stock"],
                category=cat_map.get(pd["category_key"]),
                short_description=pd.get("short_description",""),
                description_html=f"<p>{pd.get('short_description','')}</p>",
            )
            if image_files:
                rel = image_files[0]
                abs_path = os.path.join(media_root, rel)
                if os.path.exists(abs_path):
                    with open(abs_path, "rb") as f:
                        product.thumbnail.save(os.path.basename(rel), ContentFile(f.read()), save=False)
            product.save()

            for pi_idx, rel in enumerate(image_files[1:], 2):
                abs_path = os.path.join(media_root, rel)
                if os.path.exists(abs_path):
                    with open(abs_path, "rb") as f:
                        pi = ProductImage(product=product)
                        pi.image.save(os.path.basename(rel), ContentFile(f.read()), save=True)

            for v in pd.get("variants", []):
                ProductVariant.objects.create(
                    product=product, name=v["name"], value=v["value"],
                    price_modifier=v.get("price_modifier", 0)
                )
            for i, s in enumerate(pd.get("specs", [])):
                ProductSpecification.objects.create(product=product, label=s["label"], value=s["value"], order=i)
            for i, fq in enumerate(pd.get("faqs", [])):
                ProductFAQ.objects.create(product=product, question=fq["question"], answer=fq["answer"], order=i)
            for rv in pd.get("reviews", []):
                ProductReview.objects.create(
                    product=product, reviewer_name=rv["reviewer_name"],
                    rating=rv["rating"], comment=rv["comment"]
                )
            product_count += 1
            self.stdout.write(f"Created product: {pd['title']}")

        self.stdout.write(self.style.SUCCESS(f"Seeding complete: {product_count} products, {Category.objects.count()} categories, {Brand.objects.count()} brands, {District.objects.count()} districts"))
