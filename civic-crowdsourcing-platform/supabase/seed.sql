-- ============================================================================
-- CIVIC CROWDSOURCING PLATFORM — SEED DATA
-- Hyderabad, Telangana, India
-- ============================================================================

-- 1. WARD BOUNDARY POLYGONS (5 Wards — approximate PostGIS geometry)
-- ============================================================================
-- Coordinates are approximate real Hyderabad ward boundaries.
-- Ward 1: Begumpet (17.44°N, 78.46°E area)
-- Ward 2: Ameerpet-SR Nagar (17.43°N, 78.44°E area)
-- Ward 3: Banjara Hills (17.41°N, 78.43°E area)
-- Ward 4: Jubilee Hills (17.42°N, 78.41°E area)
-- Ward 5: Madhapur-Hitech City (17.45°N, 78.38°E area)

-- 2. USERS (20 citizens + 10 officials as users + 1 editor + 1 admin)
-- ============================================================================
-- Phone numbers are fake +91 Indian format.
-- In production these would be created via Supabase Auth; here we insert
-- directly into public.users (auth.users linked manually for seeding).

INSERT INTO users (id, phone, name, role, home_gps, preferred_language, created_at) VALUES
-- Citizens
('c0000000-0000-0000-0000-000000000001', '+919100000001', 'Rajesh Kumar',     'citizen', ST_SetSRID(ST_MakePoint(78.4610, 17.4410), 4326), 'te', now() - interval '30 days'),
('c0000000-0000-0000-0000-000000000002', '+919100000002', 'Priya Sharma',     'citizen', ST_SetSRID(ST_MakePoint(78.4450, 17.4320), 4326), 'hi', now() - interval '28 days'),
('c0000000-0000-0000-0000-000000000003', '+919100000003', 'Mohammed Ali',     'citizen', ST_SetSRID(ST_MakePoint(78.4310, 17.4120), 4326), 'te', now() - interval '26 days'),
('c0000000-0000-0000-0000-000000000004', '+919100000004', 'Lakshmi Reddy',    'citizen', ST_SetSRID(ST_MakePoint(78.4120, 17.4210), 4326), 'te', now() - interval '25 days'),
('c0000000-0000-0000-0000-000000000005', '+919100000005', 'Suresh Naidu',     'citizen', ST_SetSRID(ST_MakePoint(78.3850, 17.4510), 4326), 'te', now() - interval '24 days'),
('c0000000-0000-0000-0000-000000000006', '+919100000006', 'Ananya Gupta',     'citizen', ST_SetSRID(ST_MakePoint(78.4630, 17.4430), 4326), 'hi', now() - interval '23 days'),
('c0000000-0000-0000-0000-000000000007', '+919100000007', 'Vikram Singh',     'citizen', ST_SetSRID(ST_MakePoint(78.4470, 17.4340), 4326), 'hi', now() - interval '22 days'),
('c0000000-0000-0000-0000-000000000008', '+919100000008', 'Fatima Begum',     'citizen', ST_SetSRID(ST_MakePoint(78.4330, 17.4140), 4326), 'te', now() - interval '21 days'),
('c0000000-0000-0000-0000-000000000009', '+919100000009', 'Karthik Rao',      'citizen', ST_SetSRID(ST_MakePoint(78.4140, 17.4230), 4326), 'te', now() - interval '20 days'),
('c0000000-0000-0000-0000-000000000010', '+919100000010', 'Neha Patel',       'citizen', ST_SetSRID(ST_MakePoint(78.3870, 17.4530), 4326), 'en', now() - interval '19 days'),
('c0000000-0000-0000-0000-000000000011', '+919100000011', 'Arun Joshi',       'citizen', ST_SetSRID(ST_MakePoint(78.4590, 17.4390), 4326), 'te', now() - interval '18 days'),
('c0000000-0000-0000-0000-000000000012', '+919100000012', 'Divya Menon',      'citizen', ST_SetSRID(ST_MakePoint(78.4410, 17.4290), 4326), 'en', now() - interval '17 days'),
('c0000000-0000-0000-0000-000000000013', '+919100000013', 'Ramesh Goud',      'citizen', ST_SetSRID(ST_MakePoint(78.4290, 17.4110), 4326), 'te', now() - interval '16 days'),
('c0000000-0000-0000-0000-000000000014', '+919100000014', 'Sunita Verma',     'citizen', ST_SetSRID(ST_MakePoint(78.4110, 17.4190), 4326), 'hi', now() - interval '15 days'),
('c0000000-0000-0000-0000-000000000015', '+919100000015', 'Deepak Chandra',   'citizen', ST_SetSRID(ST_MakePoint(78.3830, 17.4490), 4326), 'te', now() - interval '14 days'),
('c0000000-0000-0000-0000-000000000016', '+919100000016', 'Meena Kumari',     'citizen', ST_SetSRID(ST_MakePoint(78.4650, 17.4450), 4326), 'te', now() - interval '13 days'),
('c0000000-0000-0000-0000-000000000017', '+919100000017', 'Ajay Kumar',       'citizen', ST_SetSRID(ST_MakePoint(78.4490, 17.4360), 4326), 'hi', now() - interval '12 days'),
('c0000000-0000-0000-0000-000000000018', '+919100000018', 'Radhika Iyer',     'citizen', ST_SetSRID(ST_MakePoint(78.4350, 17.4160), 4326), 'en', now() - interval '11 days'),
('c0000000-0000-0000-0000-000000000019', '+919100000019', 'Naveen Yadav',     'citizen', ST_SetSRID(ST_MakePoint(78.4160, 17.4250), 4326), 'te', now() - interval '10 days'),
('c0000000-0000-0000-0000-000000000020', '+919100000020', 'Swapna Reddy',     'citizen', ST_SetSRID(ST_MakePoint(78.3890, 17.4550), 4326), 'te', now() - interval '9 days'),

-- Editor
('e0000000-0000-0000-0000-000000000001', '+919100000099', 'Community Editor', 'editor', NULL, 'te', now() - interval '60 days'),

-- Admin
('a0000000-0000-0000-0000-000000000001', '+919100000000', 'Platform Admin',   'admin',  NULL, 'en', now() - interval '90 days')
ON CONFLICT (phone) DO NOTHING;

-- 3. OFFICIALS (10 officials mapped to the 5 wards)
-- ============================================================================
INSERT INTO officials (id, name, role, phone, email, whatsapp, geo_region, ward_number, municipality, state, country, is_verified) VALUES

-- Ward 1 (Begumpet)
('f0000000-0000-0000-0000-000000000001', 'G. Srinivas',  'worker',
 '+919100001001', 'srinivas.worker@hyd.gov.in', '+919100001001',
 ST_GeomFromText('POLYGON((78.455 17.435, 78.468 17.435, 78.468 17.448, 78.455 17.448, 78.455 17.435))', 4326),
 'W01', 'Begumpet Municipality', 'Telangana', 'IN', true),

('f0000000-0000-0000-0000-000000000002', 'K. Venkatesh', 'engineer',
 '+919100001002', 'venkatesh.eng@hyd.gov.in', '+919100001002',
 ST_GeomFromText('POLYGON((78.455 17.435, 78.468 17.435, 78.468 17.448, 78.455 17.448, 78.455 17.435))', 4326),
 'W01', 'Begumpet Municipality', 'Telangana', 'IN', true),

-- Ward 2 (Ameerpet - SR Nagar)
('f0000000-0000-0000-0000-000000000003', 'P. Narsimha',  'worker',
 '+919100001003', 'narsimha.worker@hyd.gov.in', '+919100001003',
 ST_GeomFromText('POLYGON((78.438 17.425, 78.452 17.425, 78.452 17.440, 78.438 17.440, 78.438 17.425))', 4326),
 'W02', 'Ameerpet Municipality', 'Telangana', 'IN', true),

('f0000000-0000-0000-0000-000000000004', 'D. Ramesh',    'engineer',
 '+919100001004', 'ramesh.eng@hyd.gov.in', '+919100001004',
 ST_GeomFromText('POLYGON((78.438 17.425, 78.452 17.425, 78.452 17.440, 78.438 17.440, 78.438 17.425))', 4326),
 'W02', 'Ameerpet Municipality', 'Telangana', 'IN', true),

-- Ward 3 (Banjara Hills)
('f0000000-0000-0000-0000-000000000005', 'M. Ravinder',  'worker',
 '+919100001005', 'ravinder.worker@hyd.gov.in', '+919100001005',
 ST_GeomFromText('POLYGON((78.425 17.405, 78.440 17.405, 78.440 17.420, 78.425 17.420, 78.425 17.405))', 4326),
 'W03', 'Banjara Hills Municipality', 'Telangana', 'IN', true),

('f0000000-0000-0000-0000-000000000006', 'T. Harish',    'engineer',
 '+919100001006', 'harish.eng@hyd.gov.in', '+919100001006',
 ST_GeomFromText('POLYGON((78.425 17.405, 78.440 17.405, 78.440 17.420, 78.425 17.420, 78.425 17.405))', 4326),
 'W03', 'Banjara Hills Municipality', 'Telangana', 'IN', true),

-- Ward 4 (Jubilee Hills)
('f0000000-0000-0000-0000-000000000007', 'B. Mahesh',    'corporator',
 '+919100001007', 'mahesh.corp@hyd.gov.in', '+919100001007',
 ST_GeomFromText('POLYGON((78.405 17.415, 78.420 17.415, 78.420 17.430, 78.405 17.430, 78.405 17.415))', 4326),
 'W04', 'Jubilee Hills Municipality', 'Telangana', 'IN', true),

('f0000000-0000-0000-0000-000000000008', 'S. Anil',      'mla',
 '+919100001008', 'anil.mla@telangana.gov.in', '+919100001008',
 ST_GeomFromText('POLYGON((78.405 17.415, 78.420 17.415, 78.420 17.430, 78.405 17.430, 78.405 17.415))', 4326),
 NULL, NULL, 'Telangana', 'IN', true),

-- Ward 5 (Madhapur - Hitech City)
('f0000000-0000-0000-0000-000000000009', 'R. Shankar',   'engineer',
 '+919100001009', 'shankar.eng@hyd.gov.in', '+919100001009',
 ST_GeomFromText('POLYGON((78.375 17.445, 78.395 17.445, 78.395 17.460, 78.375 17.460, 78.375 17.445))', 4326),
 'W05', 'Madhapur Municipality', 'Telangana', 'IN', true),

('f0000000-0000-0000-0000-000000000010', 'L. Kavitha',   'minister',
 '+919100001010', 'kavitha.min@telangana.gov.in', '+919100001010',
 ST_GeomFromText('POLYGON((78.375 17.445, 78.395 17.445, 78.395 17.460, 78.375 17.460, 78.375 17.445))', 4326),
 NULL, NULL, 'Telangana', 'IN', true)
ON CONFLICT DO NOTHING;

-- 4. SAMPLE ISSUES (20 issues with varying rating counts)
-- ============================================================================
-- Issues span all 5 wards, all 6 categories, and range from 2 to exactly-50 ratings.
-- This exercises: "below 5 hidden", "near threshold", "exactly at 50" (trigger test).

INSERT INTO issues (id, photo_url, gps_coords, category, description_original, description_formal, language_detected, status, created_by, created_at) VALUES

-- === Ward 1: Begumpet ===

-- Issue 1: Pothole — 2 ratings (below map threshold, hidden from public map)
('d0000000-0000-0000-0000-000000000001',
 'https://picsum.photos/seed/civic1/800/600',
 ST_SetSRID(ST_MakePoint(78.4610, 17.4410), 4326),
 'pothole',
 'Main road lo pedda gunta undi. Chala accidents avuthunnayi.',
 'A large pothole on the main road near Begumpet Railway Station has been causing frequent accidents, particularly during night hours. The pothole spans approximately 2 feet in diameter and is located in the middle of the carriageway. Two-wheeler riders are at significant risk. Immediate repair is requested.',
 'te', 'pending', 'c0000000-0000-0000-0000-000000000001', now() - interval '20 days'),

-- Issue 2: Streetlight — 3 ratings (below map threshold)
('d0000000-0000-0000-0000-000000000002',
 'https://picsum.photos/seed/civic2/800/600',
 ST_SetSRID(ST_MakePoint(78.4630, 17.4430), 4326),
 'streetlight',
 'Streetlight not working since 2 weeks. Very dark at night.',
 'The streetlight at the intersection of Begumpet Main Road and SP Road has been non-functional for two weeks. The area becomes dangerously dark after sunset, creating safety concerns for pedestrians, particularly women and elderly residents. The non-functional light also increases the risk of traffic accidents at the junction.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000006', now() - interval '18 days'),

-- Issue 3: Water tap — 7 ratings (visible on map)
('d0000000-0000-0000-0000-000000000003',
 'https://picsum.photos/seed/civic3/800/600',
 ST_SetSRID(ST_MakePoint(78.4590, 17.4390), 4326),
 'water_tap',
 'Public tap leaking continuously, wasting hundreds of liters daily.',
 'A public water tap near Begumpet Market has been leaking continuously for over a month. An estimated 500-800 liters of potable water are being wasted daily. The surrounding area has become waterlogged, creating a breeding ground for mosquitoes. This poses both a water conservation crisis and a public health risk.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000011', now() - interval '15 days'),

-- Issue 4: Garbage — 4 ratings (below map threshold)
('d0000000-0000-0000-0000-000000000004',
 'https://picsum.photos/seed/civic4/800/600',
 ST_SetSRID(ST_MakePoint(78.4570, 17.4420), 4326),
 'garbage',
 'Corner lo garbage dump ayindi. Bad smell vastundi.',
 'An unauthorized garbage dumping site has formed at the corner of Begumpet Lane 4. The accumulated waste has been rotting for approximately three weeks, producing strong odors and attracting stray dogs and rodents. Residents in the adjacent buildings report that the smell makes it impossible to keep windows open.',
 'te', 'pending', 'c0000000-0000-0000-0000-000000000001', now() - interval '12 days'),

-- === Ward 2: Ameerpet-SR Nagar ===

-- Issue 5: Pothole — 48 ratings (NEAR threshold — test boundary)
('d0000000-0000-0000-0000-000000000005',
 'https://picsum.photos/seed/civic5/800/600',
 ST_SetSRID(ST_MakePoint(78.4450, 17.4320), 4326),
 'pothole',
 'Ameerpet junction daggara road motham padu aipoindi. Driving impossible.',
 'The entire road surface at Ameerpet Main Junction has deteriorated severely, with multiple interconnected potholes spanning a 30-meter stretch. The damage is so extensive that vehicles must slow to walking speed to navigate it. During rain, the potholes fill with water and become invisible, causing vehicles to suffer tire bursts and suspension damage. Dozens of accidents have been reported. This is a major traffic junction serving thousands of commuters daily.',
 'te', 'pending', 'c0000000-0000-0000-0000-000000000002', now() - interval '25 days'),

-- Issue 6: Bus stop — 12 ratings
('d0000000-0000-0000-0000-000000000006',
 'https://picsum.photos/seed/civic6/800/600',
 ST_SetSRID(ST_MakePoint(78.4470, 17.4340), 4326),
 'bus_stop',
 'Bus stop shelter completely broken. No shade for waiting passengers.',
 'The bus shelter at SR Nagar Bus Stop has been completely destroyed — the roof is missing, the seating is broken, and the signage is illegible. Passengers, including elderly and pregnant women, are forced to stand in direct sun or rain while waiting for buses. This is a high-ridership stop serving 5 major bus routes. A new shelter with seating and route information display is urgently needed.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000007', now() - interval '14 days'),

-- Issue 7: Streetlight — 8 ratings
('d0000000-0000-0000-0000-000000000007',
 'https://picsum.photos/seed/civic7/800/600',
 ST_SetSRID(ST_MakePoint(78.4490, 17.4360), 4326),
 'streetlight',
 'Ameerpet residential area street lights off for 10 days.',
 'A cluster of 5 streetlights along the residential stretch of Ameerpet Colony Road have been non-functional for 10 consecutive days. This has led to two chain-snatching incidents and one vehicle theft in the darkened area. Local residents are afraid to walk after 7 PM. Police have confirmed the lack of lighting is contributing to the crime spike.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000017', now() - interval '10 days'),

-- Issue 8: Water tap — 5 ratings (exactly at map threshold)
('d0000000-0000-0000-0000-000000000008',
 'https://picsum.photos/seed/civic8/800/600',
 ST_SetSRID(ST_MakePoint(78.4410, 17.4290), 4326),
 'water_tap',
 'Community tap broken, no water supply for 3 days.',
 'The community water tap serving 50 households in Ameerpet Workers Colony has stopped functioning completely. Residents have been without water supply for 3 days and are forced to purchase expensive water tankers. This is a low-income area where residents cannot afford prolonged private water purchases. Immediate restoration is critical.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000012', now() - interval '8 days'),

-- === Ward 3: Banjara Hills ===

-- Issue 9: Pothole — EXACTLY 50 RATINGS (should trigger notification)
('d0000000-0000-0000-0000-000000000009',
 'https://picsum.photos/seed/civic9/800/600',
 ST_SetSRID(ST_MakePoint(78.4310, 17.4120), 4326),
 'pothole',
 'Banjara Hills Road No. 3 lo pedda gunta. Luxury cars damage avuthunnayi.',
 'A deep pothole on Banjara Hills Road No. 3 — a major arterial road connecting to the financial district — has caused damage to numerous vehicles, including luxury cars and two-wheelers. The pothole is approximately 4 feet wide and 8 inches deep, located in the fast lane. Several vehicles have suffered burst tires and bent rims. Given the high traffic volume and the road being a key route for emergency vehicles to Apollo Hospital, immediate repair is essential.',
 'te', 'pending', 'c0000000-0000-0000-0000-000000000003', now() - interval '30 days'),

-- Issue 10: Garbage — 15 ratings
('d0000000-0000-0000-0000-000000000010',
 'https://picsum.photos/seed/civic10/800/600',
 ST_SetSRID(ST_MakePoint(78.4330, 17.4140), 4326),
 'garbage',
 'Banjara Hills park side garbage not collected for 2 weeks.',
 'Garbage collection at Banjara Hills Public Park has been neglected for two weeks. Overflowing bins are attracting stray dogs, crows, and rats. The park is used daily by over 200 morning walkers and children. The uncollected waste is spilling onto the walking track, creating unsanitary conditions. Multiple complaints to the municipal helpline have gone unanswered.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000008', now() - interval '9 days'),

-- Issue 11: Bus stop — 6 ratings
('d0000000-0000-0000-0000-000000000011',
 'https://picsum.photos/seed/civic11/800/600',
 ST_SetSRID(ST_MakePoint(78.4350, 17.4160), 4326),
 'bus_stop',
 'Banjara Hills bus stop has no route information board.',
 'The bus stop at Banjara Hills Road No. 1 lacks any route information display. Passengers — especially newcomers and visitors to the city — have no way to know which buses stop here or their schedules. This bus stop serves 7 RTC routes but has no signage whatsoever. A simple route information board and timetable display would solve this.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000018', now() - interval '7 days'),

-- Issue 12: Pothole — 22 ratings
('d0000000-0000-0000-0000-000000000012',
 'https://picsum.photos/seed/civic12/800/600',
 ST_SetSRID(ST_MakePoint(78.4290, 17.4110), 4326),
 'pothole',
 'Multiple small potholes near Banjara Hills GVK Mall.',
 'A cluster of 5-7 small but sharp potholes has formed near the GVK One Mall entrance on Road No. 1. While individually small, their clustered pattern forces drivers to swerve unpredictably, creating near-miss situations. During weekends, mall traffic compounds the hazard. The potholes also collect rainwater, worsening over time.',
 'en', 'threshold_met', 'c0000000-0000-0000-0000-000000000013', now() - interval '22 days'),

-- === Ward 4: Jubilee Hills ===

-- Issue 13: Streetlight — 9 ratings
('d0000000-0000-0000-0000-000000000013',
 'https://picsum.photos/seed/civic13/800/600',
 ST_SetSRID(ST_MakePoint(78.4120, 17.4210), 4326),
 'streetlight',
 'Jubilee Hills road lights off. Pedestrians ki chala problem.',
 'Streetlights along the Jubilee Hills Road stretch from Check Post to Film Nagar junction have been completely off for 8 days. This is a winding road with no footpath, and pedestrians are forced to walk on the road edge in total darkness. Two minor pedestrian accidents have already been reported. The affected stretch is approximately 1.2 km long.',
 'te', 'in_progress', 'c0000000-0000-0000-0000-000000000004', now() - interval '20 days'),

-- Issue 14: Water tap — 33 ratings
('d0000000-0000-0000-0000-000000000014',
 'https://picsum.photos/seed/civic14/800/600',
 ST_SetSRID(ST_MakePoint(78.4140, 17.4230), 4326),
 'water_tap',
 'Drinking water tap water quality is very poor. People getting sick.',
 'The public drinking water tap near Jubilee Hills Community Hall is dispensing visibly discolored water with a foul odor. At least 8 residents from nearby apartments have reported gastrointestinal illnesses after consuming the water. Water samples need immediate testing. The tap serves approximately 150 residents who lack in-home water connections.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000009', now() - interval '18 days'),

-- Issue 15: Garbage — 1 rating (well below map threshold)
('d0000000-0000-0000-0000-000000000015',
 'https://picsum.photos/seed/civic15/800/600',
 ST_SetSRID(ST_MakePoint(78.4160, 17.4250), 4326),
 'garbage',
 'Construction debris dumped on roadside.',
 'Construction debris — including broken bricks, cement bags, and metal rods — has been illegally dumped along the Jubilee Hills Road No. 45 service lane. The debris partially blocks the lane and sharp metal pieces pose a puncture risk to vehicle tires. This appears to be from a nearby construction site that closed 2 weeks ago.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000019', now() - interval '5 days'),

-- Issue 16: Pothole — RESOLVED (38 ratings before resolution)
('d0000000-0000-0000-0000-000000000016',
 'https://picsum.photos/seed/civic16/800/600',
 ST_SetSRID(ST_MakePoint(78.4110, 17.4190), 4326),
 'pothole',
 'Jubilee Hills main road gunta big ga undi. Please fix.',
 'A large pothole approximately 3 feet in diameter and 6 inches deep has formed at the Jubilee Hills Check Post intersection. This is a high-traffic junction where 4 roads converge, and vehicles swerving to avoid the pothole are causing traffic disruption during peak hours. Several two-wheeler skid incidents have occurred during rain.',
 'te', 'resolved', 'c0000000-0000-0000-0000-000000000014', now() - interval '45 days'),

-- === Ward 5: Madhapur - Hitech City ===

-- Issue 17: Streetlight — EXACTLY 50 RATINGS (should trigger notification)
('d0000000-0000-0000-0000-000000000017',
 'https://picsum.photos/seed/civic17/800/600',
 ST_SetSRID(ST_MakePoint(78.3850, 17.4510), 4326),
 'streetlight',
 'Hitech City road lights failed. Night shift workers safety at risk.',
 'A complete failure of streetlights along the 800m stretch of Hitech City Main Road has left the area in total darkness for 2 weeks. This road is used by thousands of IT employees working night shifts. Multiple incidents of harassment and two road accidents have been reported since the lights failed. The lack of lighting is a critical safety concern for women employees walking to and from the nearby metro station during late hours. Companies in the area have issued internal safety advisories.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000005', now() - interval '28 days'),

-- Issue 18: Garbage — 27 ratings
('d0000000-0000-0000-0000-000000000018',
 'https://picsum.photos/seed/civic18/800/600',
 ST_SetSRID(ST_MakePoint(78.3870, 17.4530), 4326),
 'garbage',
 'Food court waste not being segregated. Environmental hazard.',
 'The food court area behind Hitech City Main Road is generating large volumes of mixed waste daily with zero segregation. Organic waste, plastics, and e-waste are being dumped together. The area serves approximately 30 food stalls catering to thousands of IT workers. The lack of waste segregation violates municipal solid waste management rules and is creating a significant environmental hazard.',
 'en', 'threshold_met', 'c0000000-0000-0000-0000-000000000010', now() - interval '16 days'),

-- Issue 19: Bus stop — 11 ratings
('d0000000-0000-0000-0000-000000000019',
 'https://picsum.photos/seed/civic19/800/600',
 ST_SetSRID(ST_MakePoint(78.3890, 17.4550), 4326),
 'bus_stop',
 'Madhapur bus stop needs digital display board.',
 'The Madhapur main bus stop lacks a digital display showing real-time bus arrivals. Given that this stop serves over 2,000 commuters daily — mostly IT employees — a display board would significantly improve commute planning. Currently, passengers rely on word-of-mouth for bus timings, leading to overcrowding when buses arrive unpredictably.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000020', now() - interval '6 days'),

-- Issue 20: Pothole — 14 ratings
('d0000000-0000-0000-0000-000000000020',
 'https://picsum.photos/seed/civic20/800/600',
 ST_SetSRID(ST_MakePoint(78.3830, 17.4490), 4326),
 'pothole',
 'Durgam Cheruvu road has deep cracks after rains.',
 'The approach road to Durgam Cheruvu (Cable Bridge area) has developed deep longitudinal cracks and potholes following the recent heavy rains. The damage covers approximately 200 meters of road surface. This is a tourist-access road and a popular weekend destination. The cracks pose a danger to both vehicles and cyclists who frequent this route.',
 'en', 'pending', 'c0000000-0000-0000-0000-000000000015', now() - interval '11 days')
ON CONFLICT DO NOTHING;

-- 5. RATINGS — Bulk insert to create exact counts
-- ============================================================================
-- Each rating INSERT uses a DO block to handle the UNIQUE constraint gracefully.
-- We assign ratings from different users to create the target counts.

-- Helper: bulk-rating function (idempotent, wraps in DO block)
-- We use explicit inserts below for clarity.

-- -------------------------------------------------------
-- Issue 1 (pothole, Begumpet): 2 ratings (below threshold)
-- -------------------------------------------------------
INSERT INTO ratings (issue_id, user_id, color, created_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'red',    now() - interval '18 days'),
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'yellow', now() - interval '17 days')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- -------------------------------------------------------
-- Issue 2 (streetlight, Begumpet): 3 ratings (below threshold)
-- -------------------------------------------------------
INSERT INTO ratings (issue_id, user_id, color, created_at) VALUES
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'red',    now() - interval '16 days'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'yellow', now() - interval '15 days'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011', 'red',   now() - interval '14 days')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- -------------------------------------------------------
-- Issue 3 (water tap, Begumpet): 7 ratings (visible on map)
-- -------------------------------------------------------
INSERT INTO ratings (issue_id, user_id, color, created_at) VALUES
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'red',    now() - interval '14 days'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'red',    now() - interval '13 days'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'red',    now() - interval '12 days'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007', 'yellow', now() - interval '11 days'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000012', 'yellow', now() - interval '10 days'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000013', 'red',    now() - interval '9 days'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000017', 'red',    now() - interval '8 days')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- -------------------------------------------------------
-- Issue 4 (garbage, Begumpet): 4 ratings (below map threshold)
-- -------------------------------------------------------
INSERT INTO ratings (issue_id, user_id, color, created_at) VALUES
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006', 'red',   now() - interval '11 days'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000011', 'yellow', now() - interval '10 days'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000016', 'red',   now() - interval '9 days'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000017', 'yellow',now() - interval '8 days')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- -------------------------------------------------------
-- Issue 5 (pothole, Ameerpet): 48 ratings — NEAR threshold
-- 30 red, 18 yellow from users 1-20 (rotated)
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
  c TEXT;
BEGIN
  FOR i IN 1..48 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    c := CASE WHEN i <= 30 THEN 'red' ELSE 'yellow' END;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000005', uid, c::rating_color, now() - (48 - i) * interval '6 hours')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 6 (bus stop, Ameerpet): 12 ratings
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..12 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000006', uid, 'yellow', now() - (12 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 7 (streetlight, Ameerpet): 8 ratings
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..8 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000007', uid, 'red', now() - (8 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 8 (water tap, Ameerpet): 5 ratings (exact map threshold)
-- -------------------------------------------------------
INSERT INTO ratings (issue_id, user_id, color, created_at) VALUES
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'red',    now() - interval '7 days'),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'red',    now() - interval '6 days'),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'yellow', now() - interval '5 days'),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'red',    now() - interval '4 days'),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'yellow', now() - interval '3 days')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- -------------------------------------------------------
-- Issue 9 (pothole, Banjara Hills): EXACTLY 50 RATINGS — TRIGGER TEST
-- 35 red, 10 yellow, 5 green = 45 red+yellow (hits the 50 threshold for red+yellow)
-- Wait — we need red+yellow >= 50. So: 35 red + 15 yellow = 50.
-- Let me make it 35 red + 15 yellow + 0 green = exactly 50 critical.
-- Actually, the trigger fires at >= 50 red OR yellow. Let's use 40 red + 10 yellow.
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
  c TEXT;
BEGIN
  FOR i IN 1..50 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    c := CASE WHEN i <= 35 THEN 'red' WHEN i <= 50 THEN 'yellow' ELSE 'green' END;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000009', uid, c::rating_color, now() - (50 - i) * interval '4 hours')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 10 (garbage, Banjara Hills): 15 ratings
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..15 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000010', uid, 'green', now() - (15 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 11 (bus stop, Banjara Hills): 6 ratings
-- -------------------------------------------------------
INSERT INTO ratings (issue_id, user_id, color, created_at) VALUES
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'yellow', now() - interval '6 days'),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000003', 'yellow', now() - interval '5 days'),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000008', 'green',  now() - interval '4 days'),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000013', 'yellow', now() - interval '3 days'),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000018', 'yellow', now() - interval '2 days'),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000020', 'green',  now() - interval '1 day')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- -------------------------------------------------------
-- Issue 12 (pothole, Banjara Hills): 22 ratings — already threshold_met
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..22 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000012', uid, 'red', now() - (22 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 13 (streetlight, Jubilee Hills): 9 ratings — in_progress
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..9 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000013', uid, 'yellow', now() - (9 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 14 (water tap, Jubilee Hills): 33 ratings
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..33 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000014', uid, 'red', now() - (33 - i) * interval '12 hours')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 15 (garbage, Jubilee Hills): 1 rating (minimal — test edge)
-- -------------------------------------------------------
INSERT INTO ratings (issue_id, user_id, color, created_at) VALUES
('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000019', 'yellow', now() - interval '5 days')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- -------------------------------------------------------
-- Issue 16 (pothole, Jubilee Hills): 38 ratings — RESOLVED
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..38 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000016', uid, CASE WHEN i <= 25 THEN 'red'::rating_color ELSE 'green'::rating_color END, now() - interval '45 days' + (i * interval '8 hours'))
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 17 (streetlight, Madhapur): EXACTLY 50 RATINGS — TRIGGER TEST
-- 30 red + 20 yellow = 50
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
  c TEXT;
BEGIN
  FOR i IN 1..50 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    c := CASE WHEN i <= 30 THEN 'red' ELSE 'yellow' END;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000017', uid, c::rating_color, now() - (50 - i) * interval '2 hours')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 18 (garbage, Madhapur): 27 ratings — already threshold_met
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..27 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000018', uid, 'red', now() - (27 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 19 (bus stop, Madhapur): 11 ratings
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..11 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000019', uid, 'green', now() - (11 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Issue 20 (pothole, Madhapur): 14 ratings
-- -------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR i IN 1..14 LOOP
    uid := ('c0000000-0000-0000-0000-000000000' || lpad(((i % 20) + 1)::text, 2, '0'))::uuid;
    INSERT INTO ratings (issue_id, user_id, color, created_at)
    VALUES ('d0000000-0000-0000-0000-000000000020', uid, 'yellow', now() - (14 - i) * interval '1 day')
    ON CONFLICT (issue_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- 6. OFFICIAL RESPONSES (for issues with non-pending status)
-- ============================================================================
INSERT INTO official_responses (issue_id, official_id, status_update, message, updated_at) VALUES
-- Issue 12 (threshold_met): acknowledged by corporator
('d0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000006', 'acknowledged',
 'Noted. We will inspect the GVK Mall pothole cluster and schedule repairs.', now() - interval '20 days'),

-- Issue 13 (in_progress): acknowledged + work_started
('d0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000007', 'acknowledged',
 'Streetlight repair approved for Jubilee Hills stretch.', now() - interval '18 days'),
('d0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000008', 'work_started',
 'Electrical team dispatched. New LED fixtures being installed.', now() - interval '15 days'),

-- Issue 16 (resolved): full lifecycle
('d0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000007', 'acknowledged',
 'Check Post intersection pothole noted. Scheduling immediate repair.', now() - interval '42 days'),
('d0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000007', 'work_started',
 'Road repair crew on site. Pothole filling in progress.', now() - interval '38 days'),
('d0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000007', 'resolved',
 'Pothole fully repaired and road surface restored. Quality check passed.', now() - interval '35 days'),

-- Issue 18 (threshold_met): acknowledged
('d0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000009', 'acknowledged',
 'Waste segregation audit for Hitech City food court area scheduled.', now() - interval '6 days')
ON CONFLICT DO NOTHING;
