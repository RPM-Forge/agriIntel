export const COMMODITIES = ["Wheat", "Rice", "Potato", "Onion", "Tomato"];

export const MARKET_LOCATIONS: Record<string, string[]> = {
  "Andaman and Nicobar": ["North and Middle Andaman"],
  "Andhra Pradesh": ["Annamayya", "Chittor", "Krishna", "Kurnool", "NTR", "Visakhapatnam", "YSR Kadapa"],
  Assam: ["Barpeta", "Cachar", "Darrang", "Dhemaji", "Dhubri", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "MORIGAON", "Nagaon", "Nalbari", "Sibsagar", "Sonitpur", "Tinsukia"],
  Bihar: ["Araria", "Banka", "Begusarai", "Bhojpur", "Buxar", "Chhapra", "Darbhanga", "East Champaran/ Motihari", "Jamui", "Jehanabad", "Kaithar", "Khagaria", "Kishanganj", "Madhepura", "Madhubani", "Muzaffarpur", "Patna", "Purnea", "Rohtas", "Saharsa", "Samastipur", "Sheikhpura", "Sheohar", "Supaul", "Vaishali"],
  Chandigarh: ["Chandigarh"],
  Chattisgarh: ["Balodabazar", "Balrampur", "Bemetara", "Bilaspur", "Durg", "Janjgir", "Jashpur", "Kabirdham", "Khairagarh Chhuikhadan Gandai", "Koria", "Mungeli", "Raigarh", "Raipur", "Rajnandgaon", "Surajpur", "Surguja"],
  Goa: ["North Goa"],
  Gujarat: ["Ahmedabad", "Amreli", "Anand", "Banaskanth", "Bharuch", "Bhavnagar", "Botad", "Dahod", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagarh", "Kachchh", "Kheda", "Mehsana", "Morbi", "Navsari", "Panchmahals", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Vadodara(Baroda)"],
  Haryana: ["Ambala", "Bhiwani", "Faridabad", "Fatehabad", "Gurgaon", "Hissar", "Jhajar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh-Narnaul", "Mewat", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamuna Nagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kullu", "Mandi", "Shimla", "Sirmore", "Solan", "Una"],
  "Jammu and Kashmir": ["Anantnag", "Jammu", "Kathua", "Rajouri", "Srinagar", "Udhampur"],
  Karnataka: ["Bagalkot", "Bangalore", "Belagavi", "Belgaum", "Bellary", "Bengaluru", "Bengaluru Rural", "Bengaluru South", "Bidar", "Bijapur", "Chamarajanagar", "Chamrajnagar", "Chikkaballapur", "Chikkamagaluru", "Chikmagalur", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kalburgi", "Karwar(Uttar Kannad)", "Kodagu", "Kolar", "Koppal", "Madikeri(Kodagu)", "Mandya", "Mangalore(Dakshin Kannad)", "Mysore", "Mysuru"],
  Kerala: ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasargod", "Kollam", "Kottayam", "Kozhikode(Calicut)", "Malappuram", "Palakad", "Thirssur", "Thiruvananthapuram"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anupur", "Ashoknagar", "Badwani", "Balaghat", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna"],
  Maharashtra: ["Ahilyanagar", "Ahmednagar", "Akola", "Amarawati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Chattrapati Sambhajinagar", "Dharashiv", "Dharashiv(Usmanabad)", "Dhule", "Hingoli", "Jalana", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sholapur", "Solapur", "Thane"],
  Manipur: ["Bishnupur", "Imphal East", "Imphal West", "Kakching", "Thoubal"],
  Meghalaya: ["East Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "NCT of Delhi": ["Delhi"],
  Nagaland: ["Kiphire", "Kohima", "Longleng", "Mokokchung", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  Odisha: ["Angul", "Balasore", "Bargarh", "Bhadrak", "Bolangir", "Boudh", "Cuttack", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kendrapara", "Keonjhar", "Khurda", "Koraput", "Malkangiri", "Mayurbhanja", "Nayagarh", "Nowarangpur", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Sonepur", "Sundergarh"],
  Punjab: ["Amritsar", "Barnala", "Bhatinda", "Faridkot", "Fatehgarh", "Fazilka", "Ferozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar", "Nawanshahr", "Pathankot", "Patiala", "Ropar (Rupnagar)", "Sangrur", "Tarntaran", "kapurthala"],
  Rajasthan: ["Ajmer", "Alwar", "Anupgarh", "Balotra", "Baran", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deedwana Kuchaman", "Deeg", "Dholpur", "Dudu", "Dungarpur", "Ganganagar", "Gangapur City", "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Jodhpur Rural", "Karauli", "Kekri", "Khairthal Tijara", "Kota"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakuruchi", "Kancheepuram", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Nagercoil (Kannyiakumari)", "Namakkal", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "The Nilgiris", "Theni", "Thiruchirappalli", "Thirunelveli", "Thirupathur", "Thirupur", "Thiruvannamalai", "Thiruvarur", "Thiruvellore", "Tuticorin"],
  Telangana: ["Adilabad", "Hanmakonda", "Hanumakonda", "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Medak", "Medchal Malkajgiri", "Nagarkurnool", "Nalgonda", "Ranga Reddy", "Sangareddy", "Siddipet", "Warangal"],
  Tripura: ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South District", "South Tripura", "Unokoti", "West District"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkarnagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Badaun", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi(Sant Ravi Nagar)", "Bijnor", "Bulandshahar", "Chandauli", "Chitrakut", "Deoria", "Etah", "Etawah", "Farukhabad", "Fatehpur", "Firozabad", "Gautam Budh Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur"],
  Uttarakhand: ["Champawat", "Dehradoon", "Garhwal (Pauri)", "Haridwar", "Nanital", "UdhamSinghNagar", "Udhamsinghnagar"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Burdwan", "Coochbehar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Medinipur(E)", "Medinipur(W)", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Purba Bardhaman", "Puruliya", "Sounth 24 Parganas", "Uttar Dinajpur"],
};

/** Crops the live model actually has enough history for in these landing-page states. */
export const COMMODITIES_BY_STATE: Record<string, string[]> = {
  Delhi: ["Wheat", "Rice", "Potato", "Onion", "Tomato"],
  Haryana: ["Wheat", "Potato", "Onion", "Tomato"],
  "Uttar Pradesh": ["Wheat", "Rice", "Potato", "Onion", "Tomato"],
  Rajasthan: ["Wheat", "Potato", "Onion", "Tomato"],
  "Madhya Pradesh": ["Wheat", "Potato", "Onion", "Tomato"],
  Punjab: ["Wheat", "Potato", "Onion", "Tomato"],
  Maharashtra: ["Wheat", "Rice", "Potato", "Onion", "Tomato"],
};

export const GRADES = ["Grade A", "Grade B", "Grade C", "FAQ"];