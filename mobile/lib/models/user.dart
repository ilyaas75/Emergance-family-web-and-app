class AppUser {
  final String id, name, phone;
  final String? bloodType, allergies, language;
  AppUser({required this.id, required this.name, required this.phone, this.bloodType, this.allergies, this.language});
  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['_id'] ?? j['id'] ?? '', name: j['name'] ?? '', phone: j['phone'] ?? '',
        bloodType: j['bloodType'], allergies: j['allergies'], language: j['language']);
}
