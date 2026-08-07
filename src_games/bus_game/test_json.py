import requests
import json

url = "https://github.com/academicsociety2/Kennedy/releases/download/%D8%A7%D8%AA%D9%88%D8%A8%D9%8A%D8%B3_%D9%83%D9%88%D9%85%D8%A8%D9%84%D9%8A%D8%AA/itobees_complete.json"

print("⏳ جاري الاتصال بالرابط...")

try:
    response = requests.get(url)
    
    if response.status_code == 200:
        print("✅ تم الوصول للينك بنجاح!")
        
        data = response.json()
        
        print(f"✅ تم قراءة البيانات بنجاح! الملف بيحتوي على {len(data.keys())} أقسام رئيسية.")
        print("\n📂 الأقسام الموجودة في الملف هي:")
        
        for key in data.keys():
            items_count = len(data[key]) if isinstance(data[key], (dict, list)) else 1
            print(f"- {key} (يحتوي على {items_count} عناصر فرعية)")
            
    else:
        print(f"❌Error: {response.status_code}")

except json.JSONDecodeError:
    print("❌ اللينك شغال بس الملف اللي راجع مش بصيغة JSON سليمة.")
except Exception as e:
    print(f"❌ حصل خطأ أثناء تشغيل السكربت:\n{e}")


⏳ جاري الاتصال بالرابط...
✅ تم الوصول للينك بنجاح!
✅ تم قراءة البيانات بنجاح! الملف بيحتوي على 9 أقسام رئيسية.

📂 الأقسام الموجودة في الملف هي:
- شخصيات_كرتونية (يحتوي على 28 عناصر فرعية)
- دول (يحتوي على 28 عناصر فرعية)
- جماد (يحتوي على 28 عناصر فرعية)
- شخصيات_تاريخية (يحتوي على 28 عناصر فرعية)
- نبات (يحتوي على 28 عناصر فرعية)
- أسماء (يحتوي على 2 عناصر فرعية)
- أنبياء (يحتوي على 28 عناصر فرعية)
- ممثلين (يحتوي على 28 عناصر فرعية)
- حيوانات (يحتوي على 28 عناصر فرعية)