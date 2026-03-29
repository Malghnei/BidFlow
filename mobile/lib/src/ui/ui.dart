import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';

class BootstrapScreen extends StatelessWidget {
  const BootstrapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (state.eventId != null) {
      if (state.adminMode) return const AdminHomeScreen();
      if (state.bidderId != null) return const BidderHomeScreen();
      return const RegisterBidderScreen();
    }
    return const JoinEventScreen();
  }
}

class JoinEventScreen extends StatefulWidget {
  const JoinEventScreen({super.key});
  @override
  State<JoinEventScreen> createState() => _JoinEventScreenState();
}

class _JoinEventScreenState extends State<JoinEventScreen> {
  final _urlController = TextEditingController(text: 'http://10.0.2.2:3000');
  final _passcodeController = TextEditingController(text: '123456');
  bool _adminMode = false;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Join BidFlow Event')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _urlController, decoration: const InputDecoration(labelText: 'Backend URL')),
            TextField(controller: _passcodeController, decoration: const InputDecoration(labelText: 'Event Passcode')),
            SwitchListTile(
              title: const Text('Admin mode'),
              value: _adminMode,
              onChanged: (v) => setState(() => _adminMode = v),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: state.loading
                  ? null
                  : () => context.read<AppState>().joinEvent(
                        newBaseUrl: _urlController.text,
                        newPasscode: _passcodeController.text,
                        asAdmin: _adminMode,
                      ),
              child: state.loading ? const CircularProgressIndicator() : const Text('Continue'),
            ),
            if (state.error != null) ...[
              const SizedBox(height: 12),
              Text(state.error!, style: const TextStyle(color: Colors.red)),
            ]
          ],
        ),
      ),
    );
  }
}

class RegisterBidderScreen extends StatefulWidget {
  const RegisterBidderScreen({super.key});
  @override
  State<RegisterBidderScreen> createState() => _RegisterBidderScreenState();
}

class _RegisterBidderScreenState extends State<RegisterBidderScreen> {
  final first = TextEditingController();
  final last = TextEditingController();
  final display = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: Text('Register - ${state.eventName ?? "BidFlow"}')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            TextField(controller: first, decoration: const InputDecoration(labelText: 'First name')),
            TextField(controller: last, decoration: const InputDecoration(labelText: 'Last name')),
            TextField(controller: display, decoration: const InputDecoration(labelText: 'Display name')),
            TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: phone, decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.read<AppState>().registerBidder(
                    firstName: first.text,
                    lastName: last.text,
                    displayName: display.text,
                    email: email.text.isEmpty ? null : email.text,
                    phone: phone.text.isEmpty ? null : phone.text,
                  ),
              child: const Text('Join as Bidder'),
            ),
          ],
        ),
      ),
    );
  }
}

class BidderHomeScreen extends StatefulWidget {
  const BidderHomeScreen({super.key});
  @override
  State<BidderHomeScreen> createState() => _BidderHomeScreenState();
}

class _BidderHomeScreenState extends State<BidderHomeScreen> {
  int idx = 0;
  @override
  Widget build(BuildContext context) {
    final pages = const [BidderItemsTab(), BidderGroupsTab(), BidderBidsTab(), BidderProfileTab()];
    return Scaffold(
      appBar: AppBar(title: const Text('BidFlow Bidder')),
      body: pages[idx],
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        onDestinationSelected: (i) => setState(() => idx = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.gavel), label: 'Items'),
          NavigationDestination(icon: Icon(Icons.groups), label: 'Groups'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'My Bids'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class BidderItemsTab extends StatelessWidget {
  const BidderItemsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return RefreshIndicator(
      onRefresh: state.refreshAll,
      child: ListView.builder(
        itemCount: state.items.length,
        itemBuilder: (_, i) {
          final item = state.items[i];
          final itemId = state.idOf(item);
          final currentBid = ((item['currentBid'] ?? item['startingBid'] ?? 0) as num).toDouble();
          return Card(
            child: ListTile(
              title: Text(item['title']?.toString() ?? 'Untitled'),
              subtitle: Text('Current: \$${currentBid.toStringAsFixed(2)} • ${item['status'] ?? "pending"}'),
              trailing: PopupMenuButton<String>(
                onSelected: (value) async {
                  if (value == 'bid') {
                    final amount = await _askAmount(context, currentBid + 5);
                    if (amount != null) {
                      await state.placeBid(itemId, amount);
                    }
                  }
                  if (value == 'group') {
                    final groupData = await _askGroupCreate(context);
                    if (groupData != null) {
                      await state.createGroup(itemId, groupData.$1, groupData.$2);
                    }
                  }
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'bid', child: Text('Place bid')),
                  PopupMenuItem(value: 'group', child: Text('Create group')),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<double?> _askAmount(BuildContext context, double suggested) async {
    final controller = TextEditingController(text: suggested.toStringAsFixed(2));
    return showDialog<double>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Bid Amount'),
        content: TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(labelText: 'Amount'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, double.tryParse(controller.text)),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  Future<(String, double)?> _askGroupCreate(BuildContext context) async {
    final name = TextEditingController();
    final amount = TextEditingController();
    return showDialog<(String, double)>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Create Group'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Group name')),
            TextField(controller: amount, decoration: const InputDecoration(labelText: 'Your contribution')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              final amt = double.tryParse(amount.text);
              if (amt == null || name.text.trim().isEmpty) return;
              Navigator.pop(context, (name.text.trim(), amt));
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class BidderGroupsTab extends StatefulWidget {
  const BidderGroupsTab({super.key});
  @override
  State<BidderGroupsTab> createState() => _BidderGroupsTabState();
}

class _BidderGroupsTabState extends State<BidderGroupsTab> {
  final code = TextEditingController();
  final amount = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                const Text('Join Group by Code', style: TextStyle(fontWeight: FontWeight.bold)),
                TextField(controller: code, decoration: const InputDecoration(labelText: 'Join code')),
                TextField(controller: amount, decoration: const InputDecoration(labelText: 'Contribution')),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: () async {
                    final v = double.tryParse(amount.text);
                    if (v == null) return;
                    await state.joinGroupByCode(code.text.trim(), v);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Joined group')));
                    }
                  },
                  child: const Text('Join'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        const Text('My Groups', style: TextStyle(fontWeight: FontWeight.bold)),
        ...state.myGroups.map((g) {
          final groupId = state.idOf(g);
          final total = ((g['totalAmount'] ?? 0) as num).toDouble();
          return Card(
            child: ListTile(
              title: Text(g['groupName']?.toString() ?? g['name']?.toString() ?? 'Group'),
              subtitle: Text('Total: \$${total.toStringAsFixed(2)}'),
              trailing: TextButton(
                onPressed: () => state.leaveGroup(groupId),
                child: const Text('Leave'),
              ),
            ),
          );
        }),
      ],
    );
  }
}

class BidderBidsTab extends StatelessWidget {
  const BidderBidsTab({super.key});
  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return ListView(
      children: state.myBids
          .map(
            (b) => ListTile(
              title: Text(b['itemTitle']?.toString() ?? 'Item'),
              subtitle: Text('Status: ${b['status'] ?? 'unknown'}'),
              trailing: Text('\$${((b['amount'] ?? 0) as num).toStringAsFixed(2)}'),
            ),
          )
          .toList(),
    );
  }
}

class BidderProfileTab extends StatelessWidget {
  const BidderProfileTab({super.key});
  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    Map<String, dynamic>? bidder;
    for (final b in state.bidders) {
      if (state.idOf(b) == state.bidderId) {
        bidder = b;
        break;
      }
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Event: ${state.eventName ?? "Unknown"}'),
        Text('Bidder ID: ${state.bidderId ?? "Not set"}'),
        if (bidder != null) ...[
          Text('Display name: ${bidder['displayName'] ?? ''}'),
          Text('Email: ${bidder['email'] ?? ''}'),
          Text('Phone: ${bidder['phone'] ?? ''}'),
        ],
      ],
    );
  }
}

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});
  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int idx = 0;
  @override
  Widget build(BuildContext context) {
    final pages = const [
      AdminDashboardTab(),
      AdminItemsTab(),
      AdminBiddersTab(),
      AdminGroupsTab(),
      AdminAuctioneerTab(),
      AdminCheckoutTab(),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('BidFlow Admin')),
      body: pages[idx],
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        onDestinationSelected: (i) => setState(() => idx = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.inventory), label: 'Items'),
          NavigationDestination(icon: Icon(Icons.people), label: 'Bidders'),
          NavigationDestination(icon: Icon(Icons.group_work), label: 'Groups'),
          NavigationDestination(icon: Icon(Icons.campaign), label: 'Auctioneer'),
          NavigationDestination(icon: Icon(Icons.payments), label: 'Checkout'),
        ],
      ),
    );
  }
}

class AdminDashboardTab extends StatelessWidget {
  const AdminDashboardTab({super.key});
  @override
  Widget build(BuildContext context) {
    final s = context.watch<AppState>();
    final total = s.items.fold<double>(
      0,
      (sum, i) => sum + ((i['currentBid'] ?? i['startingBid'] ?? 0) as num).toDouble(),
    );
    return RefreshIndicator(
      onRefresh: s.refreshAll,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Event: ${s.eventName ?? ""}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatCard(label: 'Total Raised', value: '\$${total.toStringAsFixed(2)}'),
              _StatCard(label: 'Items', value: '${s.items.length}'),
              _StatCard(label: 'Bidders', value: '${s.bidders.length}'),
              _StatCard(label: 'Groups', value: '${s.groups.length}'),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Live Bid Feed', style: TextStyle(fontWeight: FontWeight.bold)),
          ...s.liveBidFeed.take(20).map(
                (b) => ListTile(
                  dense: true,
                  title: Text('${b['displayName'] ?? "Bidder"} bid \$${((b['amount'] ?? 0) as num).toStringAsFixed(2)}'),
                  subtitle: Text('Item: ${b['itemId'] ?? ''}'),
                ),
              ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class AdminItemsTab extends StatelessWidget {
  const AdminItemsTab({super.key});
  @override
  Widget build(BuildContext context) {
    final s = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        FilledButton.icon(
          onPressed: () => _openCreateItemDialog(context),
          icon: const Icon(Icons.add),
          label: const Text('Add Item'),
        ),
        ...s.items.map((i) {
          final itemId = s.idOf(i);
          final status = i['status']?.toString() ?? 'upcoming';
          return Card(
            child: ListTile(
              title: Text(i['title']?.toString() ?? 'Untitled'),
              subtitle: Text('Status: $status • Current: \$${((i['currentBid'] ?? i['startingBid'] ?? 0) as num).toStringAsFixed(2)}'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextButton(onPressed: () => s.openItem(itemId), child: const Text('Open')),
                  TextButton(onPressed: () => s.closeItem(itemId), child: const Text('Close')),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Future<void> _openCreateItemDialog(BuildContext context) async {
    final title = TextEditingController();
    final description = TextEditingController();
    final amount = TextEditingController();
    final image = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Create Item'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
            TextField(controller: description, decoration: const InputDecoration(labelText: 'Description')),
            TextField(controller: amount, decoration: const InputDecoration(labelText: 'Starting bid')),
            TextField(controller: image, decoration: const InputDecoration(labelText: 'Image URL')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final startingBid = double.tryParse(amount.text);
              if (startingBid == null) return;
              await context.read<AppState>().createItem(
                    title: title.text.trim(),
                    description: description.text.trim(),
                    startingBid: startingBid,
                    imageUrl: image.text.trim(),
                  );
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class AdminBiddersTab extends StatelessWidget {
  const AdminBiddersTab({super.key});
  @override
  Widget build(BuildContext context) {
    final s = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        FilledButton.icon(
          onPressed: () => _openRegisterWalkInDialog(context),
          icon: const Icon(Icons.person_add),
          label: const Text('Register Walk-in'),
        ),
        ...s.bidders.map(
          (b) => ListTile(
            title: Text('${b['firstName'] ?? ''} ${b['lastName'] ?? ''}'.trim()),
            subtitle: Text('Display: ${b['displayName'] ?? ''}'),
          ),
        )
      ],
    );
  }

  Future<void> _openRegisterWalkInDialog(BuildContext context) async {
    final fullName = TextEditingController();
    final display = TextEditingController();
    final email = TextEditingController();
    final phone = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Register Walk-in Bidder'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: fullName, decoration: const InputDecoration(labelText: 'Full name')),
            TextField(controller: display, decoration: const InputDecoration(labelText: 'Display name')),
            TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: phone, decoration: const InputDecoration(labelText: 'Phone')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final parts = fullName.text.trim().split(RegExp(r'\s+'));
              final firstName = parts.isEmpty ? fullName.text.trim() : parts.first;
              final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : firstName;
              await context.read<AppState>().registerWalkIn(
                    firstName: firstName,
                    lastName: lastName,
                    displayName: display.text.trim(),
                    email: email.text.trim().isEmpty ? null : email.text.trim(),
                    phone: phone.text.trim().isEmpty ? null : phone.text.trim(),
                  );
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Register'),
          ),
        ],
      ),
    );
  }
}

class AdminGroupsTab extends StatelessWidget {
  const AdminGroupsTab({super.key});
  @override
  Widget build(BuildContext context) {
    final s = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(12),
      children: s.groups.map((g) {
        final groupId = s.idOf(g);
        final itemId = (g['itemId'] ?? '').toString();
        final candidates = s.groups
            .where((other) => s.idOf(other) != groupId && (other['itemId'] ?? '').toString() == itemId && other['status'] == 'active')
            .toList();
        return Card(
          child: ListTile(
            title: Text(g['groupName']?.toString() ?? g['name']?.toString() ?? 'Group'),
            subtitle: Text('Total \$${((g['totalAmount'] ?? 0) as num).toStringAsFixed(2)} • Members ${((g['members'] as List?)?.length ?? 0)}'),
            trailing: PopupMenuButton<String>(
              onSelected: (sourceId) => s.mergeGroups(groupId, sourceId),
              itemBuilder: (_) => candidates
                  .map(
                    (c) => PopupMenuItem(
                      value: s.idOf(c),
                      child: Text('Merge ${c['groupName'] ?? c['name']} into this'),
                    ),
                  )
                  .toList(),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class AdminAuctioneerTab extends StatelessWidget {
  const AdminAuctioneerTab({super.key});
  @override
  Widget build(BuildContext context) {
    final s = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        const Text('Auctioneer Controls', style: TextStyle(fontWeight: FontWeight.bold)),
        ...s.items.map((i) {
          final itemId = s.idOf(i);
          final title = i['title']?.toString() ?? 'Untitled';
          final bid = ((i['currentBid'] ?? i['startingBid'] ?? 0) as num).toDouble();
          return Card(
            child: ListTile(
              title: Text(title),
              subtitle: Text('Current \$${bid.toStringAsFixed(2)}'),
              trailing: Wrap(
                spacing: 8,
                children: [
                  FilledButton.tonal(onPressed: () => s.openItem(itemId), child: const Text('Open')),
                  FilledButton(onPressed: () => s.closeItem(itemId), child: const Text('SOLD')),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class AdminCheckoutTab extends StatelessWidget {
  const AdminCheckoutTab({super.key});
  @override
  Widget build(BuildContext context) {
    final s = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        FilledButton.icon(
          onPressed: s.openExportCsv,
          icon: const Icon(Icons.download),
          label: const Text('Export CSV'),
        ),
        ...s.checkoutItems.map((row) {
          final winnerInfo = (row['winnerInfo'] as Map?)?.cast<String, dynamic>();
          final maybeBidderId = winnerInfo?['bidderId']?.toString();
          return Card(
            child: ListTile(
              title: Text(row['title']?.toString() ?? 'Item'),
              subtitle: Text('Winner: ${row['winner'] ?? 'N/A'}'),
              trailing: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('\$${((row['finalBid'] ?? 0) as num).toStringAsFixed(2)}'),
                  if (maybeBidderId != null)
                    TextButton(
                      onPressed: () => s.markPaid(maybeBidderId),
                      child: const Text('Mark paid'),
                    ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
