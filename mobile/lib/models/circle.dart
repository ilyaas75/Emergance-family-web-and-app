class Circle {
  final String id, name, type, inviteCode;
  final int memberCount;
  Circle({required this.id, required this.name, required this.type, required this.inviteCode, required this.memberCount});
  factory Circle.fromJson(Map<String, dynamic> j) => Circle(
        id: j['_id'] ?? '', name: j['name'] ?? '', type: j['type'] ?? 'family',
        inviteCode: j['inviteCode'] ?? '', memberCount: (j['members'] as List?)?.length ?? 0);
}
