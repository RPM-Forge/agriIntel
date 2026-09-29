"""
Approximate lat/lon coordinates for major districts across 15 states,
used for real distance-based location scoring (haversine formula).
"""

DISTRICT_COORDS = {
    ("Maharashtra", "Nashik"): (19.9975, 73.7898),
    ("Maharashtra", "Pune"): (18.5204, 73.8567),
    ("Maharashtra", "Nagpur"): (21.1458, 79.0882),
    ("Maharashtra", "Aurangabad"): (19.8762, 75.3433),
    ("Maharashtra", "Kolhapur"): (16.7050, 74.2433),

    ("Uttar Pradesh", "Lucknow"): (26.8467, 80.9462),
    ("Uttar Pradesh", "Auraiya"): (26.4735, 79.5119),
    ("Uttar Pradesh", "Sitapur"): (27.5674, 80.6811),
    ("Uttar Pradesh", "Kanpur"): (26.4499, 80.3319),
    ("Uttar Pradesh", "Varanasi"): (25.3176, 82.9739),

    ("Bihar", "Patna"): (25.5941, 85.1376),
    ("Bihar", "Gaya"): (24.7955, 85.0002),
    ("Bihar", "Muzaffarpur"): (26.1209, 85.3647),
    ("Bihar", "Bhagalpur"): (25.2445, 86.9718),

    ("Gujarat", "Surat"): (21.1702, 72.8311),
    ("Gujarat", "Rajkot"): (22.3039, 70.8022),
    ("Gujarat", "Ahmedabad"): (23.0225, 72.5714),
    ("Gujarat", "Vadodara"): (22.3072, 73.1812),

    ("Karnataka", "Bengaluru Rural"): (13.0827, 77.5877),
    ("Karnataka", "Belagavi"): (15.8497, 74.4977),
    ("Karnataka", "Mysuru"): (12.2958, 76.6394),
    ("Karnataka", "Hubballi"): (15.3647, 75.1240),

    ("Madhya Pradesh", "Bhopal"): (23.2599, 77.4126),
    ("Madhya Pradesh", "Indore"): (22.7196, 75.8577),
    ("Madhya Pradesh", "Gwalior"): (26.2183, 78.1828),
    ("Madhya Pradesh", "Jabalpur"): (23.1815, 79.9864),

    ("Punjab", "Ludhiana"): (30.9010, 75.8573),
    ("Punjab", "Amritsar"): (31.6340, 74.8723),
    ("Punjab", "Jalandhar"): (31.3260, 75.5762),
    ("Punjab", "Patiala"): (30.3398, 76.3869),

    ("Haryana", "Karnal"): (29.6857, 76.9905),
    ("Haryana", "Hisar"): (29.1492, 75.7217),
    ("Haryana", "Rohtak"): (28.8955, 76.6066),
    ("Haryana", "Ambala"): (30.3782, 76.7767),

    ("Rajasthan", "Jaipur"): (26.9124, 75.7873),
    ("Rajasthan", "Kota"): (25.2138, 75.8648),
    ("Rajasthan", "Jodhpur"): (26.2389, 73.0243),
    ("Rajasthan", "Udaipur"): (24.5854, 73.7125),

    ("West Bengal", "Kolkata"): (22.5726, 88.3639),
    ("West Bengal", "Bardhaman"): (23.2324, 87.8615),
    ("West Bengal", "Siliguri"): (26.7271, 88.3953),
    ("West Bengal", "Murshidabad"): (24.1770, 88.2790),

    ("Telangana", "Hyderabad"): (17.3850, 78.4867),
    ("Telangana", "Warangal"): (17.9784, 79.6000),
    ("Telangana", "Nizamabad"): (18.6725, 78.0941),
    ("Telangana", "Khammam"): (17.2473, 80.1514),

    ("Andhra Pradesh", "Vijayawada"): (16.5062, 80.6480),
    ("Andhra Pradesh", "Guntur"): (16.3067, 80.4365),
    ("Andhra Pradesh", "Visakhapatnam"): (17.6868, 83.2185),
    ("Andhra Pradesh", "Kurnool"): (15.8281, 78.0373),

    ("Odisha", "Bhubaneswar"): (20.2961, 85.8245),
    ("Odisha", "Cuttack"): (20.4625, 85.8828),
    ("Odisha", "Sambalpur"): (21.4669, 83.9756),
    ("Odisha", "Berhampur"): (19.3149, 84.7941),

    ("Tamil Nadu", "Coimbatore"): (11.0168, 76.9558),
    ("Tamil Nadu", "Madurai"): (9.9252, 78.1198),
    ("Tamil Nadu", "Salem"): (11.6643, 78.1460),
    ("Tamil Nadu", "Tiruchirappalli"): (10.7905, 78.7047),

    ("Chhattisgarh", "Raipur"): (21.2514, 81.6296),
    ("Chhattisgarh", "Bilaspur"): (22.0797, 82.1391),
    ("Chhattisgarh", "Durg"): (21.1904, 81.2849),
}
