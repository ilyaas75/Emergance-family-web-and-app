class AppUser {
  final String id, name, phone;
  final String? bloodType, allergies, conditions, medications, language, role;
  final List<Map<String, dynamic>> emergencyContacts;

  AppUser({
    required this.id,
    required this.name,
    required this.phone,
    this.bloodType,
    this.allergies,
    this.conditions,
    this.medications,
    this.language,
    this.role,
    this.emergencyContacts = const [],
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['_id'] ?? j['id'] ?? '', name: j['name'] ?? '', phone: j['phone'] ?? '',
        bloodType: j['bloodType'], allergies: j['allergies'], conditions: j['conditions'],
        medications: j['medications'], language: j['language'], role: j['role'],
        emergencyContacts: ((j['emergencyContacts'] as List?) ?? [])
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList());
}
