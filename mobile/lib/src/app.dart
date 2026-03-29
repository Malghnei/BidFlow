import 'package:flutter/material.dart';

import 'ui/ui.dart';

class BidFlowApp extends StatelessWidget {
  const BidFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BidFlow Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1F4F82)),
        useMaterial3: true,
      ),
      home: const BootstrapScreen(),
    );
  }
}
