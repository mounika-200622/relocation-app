-- DropForeignKey
ALTER TABLE `Listing` DROP FOREIGN KEY `Listing_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `RoommateRequest` DROP FOREIGN KEY `RoommateRequest_listingId_fkey`;

-- DropForeignKey
ALTER TABLE `RoommateRequest` DROP FOREIGN KEY `RoommateRequest_requesterId_fkey`;

-- DropForeignKey
ALTER TABLE `Conversation` DROP FOREIGN KEY `Conversation_userAId_fkey`;

-- DropForeignKey
ALTER TABLE `Conversation` DROP FOREIGN KEY `Conversation_userBId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `POI` DROP FOREIGN KEY `POI_cityId_fkey`;

-- DropForeignKey
ALTER TABLE `Itinerary` DROP FOREIGN KEY `Itinerary_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ItineraryItem` DROP FOREIGN KEY `ItineraryItem_itineraryId_fkey`;

-- DropIndex
DROP INDEX `City_name_countryId_key` ON `City`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `onboardedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `name` VARCHAR(80) NOT NULL,
    MODIFY `passwordHash` VARCHAR(100) NOT NULL,
    MODIFY `role` ENUM('USER', 'BUSINESS', 'ADMIN') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `Country` ADD COLUMN `currency` CHAR(3) NOT NULL DEFAULT 'USD',
    ADD COLUMN `flag` VARCHAR(16) NULL,
    ADD COLUMN `isoCode` CHAR(2) NULL,
    ADD COLUMN `lat` DOUBLE NULL,
    ADD COLUMN `lng` DOUBLE NULL,
    ADD COLUMN `phoneCode` VARCHAR(20) NULL,
    MODIFY `name` VARCHAR(100) NOT NULL;

-- Backfill ISO codes for countries typed as free text in v1. If a row cannot be
-- mapped the next statement fails on purpose: fix the name or run npm run db:reset.
UPDATE `Country` SET `isoCode` = CASE LOWER(TRIM(`name`))
    WHEN 'aruba' THEN 'AW'
    WHEN 'afghanistan' THEN 'AF'
    WHEN 'islamic republic of afghanistan' THEN 'AF'
    WHEN 'angola' THEN 'AO'
    WHEN 'republic of angola' THEN 'AO'
    WHEN 'anguilla' THEN 'AI'
    WHEN 'åland islands' THEN 'AX'
    WHEN 'albania' THEN 'AL'
    WHEN 'republic of albania' THEN 'AL'
    WHEN 'andorra' THEN 'AD'
    WHEN 'principality of andorra' THEN 'AD'
    WHEN 'united arab emirates' THEN 'AE'
    WHEN 'argentina' THEN 'AR'
    WHEN 'argentine republic' THEN 'AR'
    WHEN 'armenia' THEN 'AM'
    WHEN 'republic of armenia' THEN 'AM'
    WHEN 'american samoa' THEN 'AS'
    WHEN 'antarctica' THEN 'AQ'
    WHEN 'french southern and antarctic lands' THEN 'TF'
    WHEN 'territory of the french southern and antarctic lands' THEN 'TF'
    WHEN 'antigua and barbuda' THEN 'AG'
    WHEN 'australia' THEN 'AU'
    WHEN 'commonwealth of australia' THEN 'AU'
    WHEN 'austria' THEN 'AT'
    WHEN 'republic of austria' THEN 'AT'
    WHEN 'azerbaijan' THEN 'AZ'
    WHEN 'republic of azerbaijan' THEN 'AZ'
    WHEN 'burundi' THEN 'BI'
    WHEN 'republic of burundi' THEN 'BI'
    WHEN 'belgium' THEN 'BE'
    WHEN 'kingdom of belgium' THEN 'BE'
    WHEN 'benin' THEN 'BJ'
    WHEN 'republic of benin' THEN 'BJ'
    WHEN 'burkina faso' THEN 'BF'
    WHEN 'bangladesh' THEN 'BD'
    WHEN 'people''s republic of bangladesh' THEN 'BD'
    WHEN 'bulgaria' THEN 'BG'
    WHEN 'republic of bulgaria' THEN 'BG'
    WHEN 'bahrain' THEN 'BH'
    WHEN 'kingdom of bahrain' THEN 'BH'
    WHEN 'bahamas' THEN 'BS'
    WHEN 'commonwealth of the bahamas' THEN 'BS'
    WHEN 'bosnia and herzegovina' THEN 'BA'
    WHEN 'saint barthélemy' THEN 'BL'
    WHEN 'collectivity of saint barthélemy' THEN 'BL'
    WHEN 'saint helena, ascension and tristan da cunha' THEN 'SH'
    WHEN 'belarus' THEN 'BY'
    WHEN 'republic of belarus' THEN 'BY'
    WHEN 'belize' THEN 'BZ'
    WHEN 'bermuda' THEN 'BM'
    WHEN 'bolivia' THEN 'BO'
    WHEN 'plurinational state of bolivia' THEN 'BO'
    WHEN 'caribbean netherlands' THEN 'BQ'
    WHEN 'bonaire, sint eustatius and saba' THEN 'BQ'
    WHEN 'brazil' THEN 'BR'
    WHEN 'federative republic of brazil' THEN 'BR'
    WHEN 'barbados' THEN 'BB'
    WHEN 'brunei' THEN 'BN'
    WHEN 'nation of brunei, abode of peace' THEN 'BN'
    WHEN 'bhutan' THEN 'BT'
    WHEN 'kingdom of bhutan' THEN 'BT'
    WHEN 'bouvet island' THEN 'BV'
    WHEN 'botswana' THEN 'BW'
    WHEN 'republic of botswana' THEN 'BW'
    WHEN 'central african republic' THEN 'CF'
    WHEN 'canada' THEN 'CA'
    WHEN 'cocos (keeling) islands' THEN 'CC'
    WHEN 'territory of the cocos (keeling) islands' THEN 'CC'
    WHEN 'switzerland' THEN 'CH'
    WHEN 'swiss confederation' THEN 'CH'
    WHEN 'chile' THEN 'CL'
    WHEN 'republic of chile' THEN 'CL'
    WHEN 'china' THEN 'CN'
    WHEN 'people''s republic of china' THEN 'CN'
    WHEN 'ivory coast' THEN 'CI'
    WHEN 'republic of côte d''ivoire' THEN 'CI'
    WHEN 'cameroon' THEN 'CM'
    WHEN 'republic of cameroon' THEN 'CM'
    WHEN 'dr congo' THEN 'CD'
    WHEN 'democratic republic of the congo' THEN 'CD'
    WHEN 'republic of the congo' THEN 'CG'
    WHEN 'cook islands' THEN 'CK'
    WHEN 'colombia' THEN 'CO'
    WHEN 'republic of colombia' THEN 'CO'
    WHEN 'comoros' THEN 'KM'
    WHEN 'union of the comoros' THEN 'KM'
    WHEN 'cape verde' THEN 'CV'
    WHEN 'republic of cabo verde' THEN 'CV'
    WHEN 'costa rica' THEN 'CR'
    WHEN 'republic of costa rica' THEN 'CR'
    WHEN 'cuba' THEN 'CU'
    WHEN 'republic of cuba' THEN 'CU'
    WHEN 'curaçao' THEN 'CW'
    WHEN 'country of curaçao' THEN 'CW'
    WHEN 'christmas island' THEN 'CX'
    WHEN 'territory of christmas island' THEN 'CX'
    WHEN 'cayman islands' THEN 'KY'
    WHEN 'cyprus' THEN 'CY'
    WHEN 'republic of cyprus' THEN 'CY'
    WHEN 'czechia' THEN 'CZ'
    WHEN 'czech republic' THEN 'CZ'
    WHEN 'germany' THEN 'DE'
    WHEN 'federal republic of germany' THEN 'DE'
    WHEN 'djibouti' THEN 'DJ'
    WHEN 'republic of djibouti' THEN 'DJ'
    WHEN 'dominica' THEN 'DM'
    WHEN 'commonwealth of dominica' THEN 'DM'
    WHEN 'denmark' THEN 'DK'
    WHEN 'kingdom of denmark' THEN 'DK'
    WHEN 'dominican republic' THEN 'DO'
    WHEN 'algeria' THEN 'DZ'
    WHEN 'people''s democratic republic of algeria' THEN 'DZ'
    WHEN 'ecuador' THEN 'EC'
    WHEN 'republic of ecuador' THEN 'EC'
    WHEN 'egypt' THEN 'EG'
    WHEN 'arab republic of egypt' THEN 'EG'
    WHEN 'eritrea' THEN 'ER'
    WHEN 'state of eritrea' THEN 'ER'
    WHEN 'western sahara' THEN 'EH'
    WHEN 'sahrawi arab democratic republic' THEN 'EH'
    WHEN 'spain' THEN 'ES'
    WHEN 'kingdom of spain' THEN 'ES'
    WHEN 'estonia' THEN 'EE'
    WHEN 'republic of estonia' THEN 'EE'
    WHEN 'ethiopia' THEN 'ET'
    WHEN 'federal democratic republic of ethiopia' THEN 'ET'
    WHEN 'finland' THEN 'FI'
    WHEN 'republic of finland' THEN 'FI'
    WHEN 'fiji' THEN 'FJ'
    WHEN 'republic of fiji' THEN 'FJ'
    WHEN 'falkland islands' THEN 'FK'
    WHEN 'france' THEN 'FR'
    WHEN 'french republic' THEN 'FR'
    WHEN 'faroe islands' THEN 'FO'
    WHEN 'micronesia' THEN 'FM'
    WHEN 'federated states of micronesia' THEN 'FM'
    WHEN 'gabon' THEN 'GA'
    WHEN 'gabonese republic' THEN 'GA'
    WHEN 'united kingdom' THEN 'GB'
    WHEN 'united kingdom of great britain and northern ireland' THEN 'GB'
    WHEN 'georgia' THEN 'GE'
    WHEN 'guernsey' THEN 'GG'
    WHEN 'bailiwick of guernsey' THEN 'GG'
    WHEN 'ghana' THEN 'GH'
    WHEN 'republic of ghana' THEN 'GH'
    WHEN 'gibraltar' THEN 'GI'
    WHEN 'guinea' THEN 'GN'
    WHEN 'republic of guinea' THEN 'GN'
    WHEN 'guadeloupe' THEN 'GP'
    WHEN 'gambia' THEN 'GM'
    WHEN 'republic of the gambia' THEN 'GM'
    WHEN 'guinea-bissau' THEN 'GW'
    WHEN 'republic of guinea-bissau' THEN 'GW'
    WHEN 'equatorial guinea' THEN 'GQ'
    WHEN 'republic of equatorial guinea' THEN 'GQ'
    WHEN 'greece' THEN 'GR'
    WHEN 'hellenic republic' THEN 'GR'
    WHEN 'grenada' THEN 'GD'
    WHEN 'greenland' THEN 'GL'
    WHEN 'guatemala' THEN 'GT'
    WHEN 'republic of guatemala' THEN 'GT'
    WHEN 'french guiana' THEN 'GF'
    WHEN 'guiana' THEN 'GF'
    WHEN 'guam' THEN 'GU'
    WHEN 'guyana' THEN 'GY'
    WHEN 'co-operative republic of guyana' THEN 'GY'
    WHEN 'hong kong' THEN 'HK'
    WHEN 'hong kong special administrative region of the people''s republic of china' THEN 'HK'
    WHEN 'heard island and mcdonald islands' THEN 'HM'
    WHEN 'honduras' THEN 'HN'
    WHEN 'republic of honduras' THEN 'HN'
    WHEN 'croatia' THEN 'HR'
    WHEN 'republic of croatia' THEN 'HR'
    WHEN 'haiti' THEN 'HT'
    WHEN 'republic of haiti' THEN 'HT'
    WHEN 'hungary' THEN 'HU'
    WHEN 'indonesia' THEN 'ID'
    WHEN 'republic of indonesia' THEN 'ID'
    WHEN 'isle of man' THEN 'IM'
    WHEN 'india' THEN 'IN'
    WHEN 'republic of india' THEN 'IN'
    WHEN 'british indian ocean territory' THEN 'IO'
    WHEN 'ireland' THEN 'IE'
    WHEN 'republic of ireland' THEN 'IE'
    WHEN 'iran' THEN 'IR'
    WHEN 'islamic republic of iran' THEN 'IR'
    WHEN 'iraq' THEN 'IQ'
    WHEN 'republic of iraq' THEN 'IQ'
    WHEN 'iceland' THEN 'IS'
    WHEN 'israel' THEN 'IL'
    WHEN 'state of israel' THEN 'IL'
    WHEN 'italy' THEN 'IT'
    WHEN 'italian republic' THEN 'IT'
    WHEN 'jamaica' THEN 'JM'
    WHEN 'jersey' THEN 'JE'
    WHEN 'bailiwick of jersey' THEN 'JE'
    WHEN 'jordan' THEN 'JO'
    WHEN 'hashemite kingdom of jordan' THEN 'JO'
    WHEN 'japan' THEN 'JP'
    WHEN 'kazakhstan' THEN 'KZ'
    WHEN 'republic of kazakhstan' THEN 'KZ'
    WHEN 'kenya' THEN 'KE'
    WHEN 'republic of kenya' THEN 'KE'
    WHEN 'kyrgyzstan' THEN 'KG'
    WHEN 'kyrgyz republic' THEN 'KG'
    WHEN 'cambodia' THEN 'KH'
    WHEN 'kingdom of cambodia' THEN 'KH'
    WHEN 'kiribati' THEN 'KI'
    WHEN 'independent and sovereign republic of kiribati' THEN 'KI'
    WHEN 'saint kitts and nevis' THEN 'KN'
    WHEN 'federation of saint christopher and nevis' THEN 'KN'
    WHEN 'south korea' THEN 'KR'
    WHEN 'republic of korea' THEN 'KR'
    WHEN 'kosovo' THEN 'XK'
    WHEN 'republic of kosovo' THEN 'XK'
    WHEN 'kuwait' THEN 'KW'
    WHEN 'state of kuwait' THEN 'KW'
    WHEN 'laos' THEN 'LA'
    WHEN 'lao people''s democratic republic' THEN 'LA'
    WHEN 'lebanon' THEN 'LB'
    WHEN 'lebanese republic' THEN 'LB'
    WHEN 'liberia' THEN 'LR'
    WHEN 'republic of liberia' THEN 'LR'
    WHEN 'libya' THEN 'LY'
    WHEN 'state of libya' THEN 'LY'
    WHEN 'saint lucia' THEN 'LC'
    WHEN 'liechtenstein' THEN 'LI'
    WHEN 'principality of liechtenstein' THEN 'LI'
    WHEN 'sri lanka' THEN 'LK'
    WHEN 'democratic socialist republic of sri lanka' THEN 'LK'
    WHEN 'lesotho' THEN 'LS'
    WHEN 'kingdom of lesotho' THEN 'LS'
    WHEN 'lithuania' THEN 'LT'
    WHEN 'republic of lithuania' THEN 'LT'
    WHEN 'luxembourg' THEN 'LU'
    WHEN 'grand duchy of luxembourg' THEN 'LU'
    WHEN 'latvia' THEN 'LV'
    WHEN 'republic of latvia' THEN 'LV'
    WHEN 'macau' THEN 'MO'
    WHEN 'macao special administrative region of the people''s republic of china' THEN 'MO'
    WHEN 'saint martin' THEN 'MF'
    WHEN 'morocco' THEN 'MA'
    WHEN 'kingdom of morocco' THEN 'MA'
    WHEN 'monaco' THEN 'MC'
    WHEN 'principality of monaco' THEN 'MC'
    WHEN 'moldova' THEN 'MD'
    WHEN 'republic of moldova' THEN 'MD'
    WHEN 'madagascar' THEN 'MG'
    WHEN 'republic of madagascar' THEN 'MG'
    WHEN 'maldives' THEN 'MV'
    WHEN 'republic of the maldives' THEN 'MV'
    WHEN 'mexico' THEN 'MX'
    WHEN 'united mexican states' THEN 'MX'
    WHEN 'marshall islands' THEN 'MH'
    WHEN 'republic of the marshall islands' THEN 'MH'
    WHEN 'north macedonia' THEN 'MK'
    WHEN 'republic of north macedonia' THEN 'MK'
    WHEN 'mali' THEN 'ML'
    WHEN 'republic of mali' THEN 'ML'
    WHEN 'malta' THEN 'MT'
    WHEN 'republic of malta' THEN 'MT'
    WHEN 'myanmar' THEN 'MM'
    WHEN 'republic of the union of myanmar' THEN 'MM'
    WHEN 'montenegro' THEN 'ME'
    WHEN 'mongolia' THEN 'MN'
    WHEN 'northern mariana islands' THEN 'MP'
    WHEN 'commonwealth of the northern mariana islands' THEN 'MP'
    WHEN 'mozambique' THEN 'MZ'
    WHEN 'republic of mozambique' THEN 'MZ'
    WHEN 'mauritania' THEN 'MR'
    WHEN 'islamic republic of mauritania' THEN 'MR'
    WHEN 'montserrat' THEN 'MS'
    WHEN 'martinique' THEN 'MQ'
    WHEN 'mauritius' THEN 'MU'
    WHEN 'republic of mauritius' THEN 'MU'
    WHEN 'malawi' THEN 'MW'
    WHEN 'republic of malawi' THEN 'MW'
    WHEN 'malaysia' THEN 'MY'
    WHEN 'mayotte' THEN 'YT'
    WHEN 'department of mayotte' THEN 'YT'
    WHEN 'namibia' THEN 'NA'
    WHEN 'republic of namibia' THEN 'NA'
    WHEN 'new caledonia' THEN 'NC'
    WHEN 'niger' THEN 'NE'
    WHEN 'republic of niger' THEN 'NE'
    WHEN 'norfolk island' THEN 'NF'
    WHEN 'territory of norfolk island' THEN 'NF'
    WHEN 'nigeria' THEN 'NG'
    WHEN 'federal republic of nigeria' THEN 'NG'
    WHEN 'nicaragua' THEN 'NI'
    WHEN 'republic of nicaragua' THEN 'NI'
    WHEN 'niue' THEN 'NU'
    WHEN 'netherlands' THEN 'NL'
    WHEN 'kingdom of the netherlands' THEN 'NL'
    WHEN 'norway' THEN 'NO'
    WHEN 'kingdom of norway' THEN 'NO'
    WHEN 'nepal' THEN 'NP'
    WHEN 'federal democratic republic of nepal' THEN 'NP'
    WHEN 'nauru' THEN 'NR'
    WHEN 'republic of nauru' THEN 'NR'
    WHEN 'new zealand' THEN 'NZ'
    WHEN 'oman' THEN 'OM'
    WHEN 'sultanate of oman' THEN 'OM'
    WHEN 'pakistan' THEN 'PK'
    WHEN 'islamic republic of pakistan' THEN 'PK'
    WHEN 'panama' THEN 'PA'
    WHEN 'republic of panama' THEN 'PA'
    WHEN 'pitcairn islands' THEN 'PN'
    WHEN 'pitcairn group of islands' THEN 'PN'
    WHEN 'peru' THEN 'PE'
    WHEN 'republic of peru' THEN 'PE'
    WHEN 'philippines' THEN 'PH'
    WHEN 'republic of the philippines' THEN 'PH'
    WHEN 'palau' THEN 'PW'
    WHEN 'republic of palau' THEN 'PW'
    WHEN 'papua new guinea' THEN 'PG'
    WHEN 'independent state of papua new guinea' THEN 'PG'
    WHEN 'poland' THEN 'PL'
    WHEN 'republic of poland' THEN 'PL'
    WHEN 'puerto rico' THEN 'PR'
    WHEN 'commonwealth of puerto rico' THEN 'PR'
    WHEN 'north korea' THEN 'KP'
    WHEN 'democratic people''s republic of korea' THEN 'KP'
    WHEN 'portugal' THEN 'PT'
    WHEN 'portuguese republic' THEN 'PT'
    WHEN 'paraguay' THEN 'PY'
    WHEN 'republic of paraguay' THEN 'PY'
    WHEN 'palestine' THEN 'PS'
    WHEN 'state of palestine' THEN 'PS'
    WHEN 'french polynesia' THEN 'PF'
    WHEN 'qatar' THEN 'QA'
    WHEN 'state of qatar' THEN 'QA'
    WHEN 'réunion' THEN 'RE'
    WHEN 'réunion island' THEN 'RE'
    WHEN 'romania' THEN 'RO'
    WHEN 'russia' THEN 'RU'
    WHEN 'russian federation' THEN 'RU'
    WHEN 'rwanda' THEN 'RW'
    WHEN 'republic of rwanda' THEN 'RW'
    WHEN 'saudi arabia' THEN 'SA'
    WHEN 'kingdom of saudi arabia' THEN 'SA'
    WHEN 'sudan' THEN 'SD'
    WHEN 'republic of the sudan' THEN 'SD'
    WHEN 'senegal' THEN 'SN'
    WHEN 'republic of senegal' THEN 'SN'
    WHEN 'singapore' THEN 'SG'
    WHEN 'republic of singapore' THEN 'SG'
    WHEN 'south georgia' THEN 'GS'
    WHEN 'south georgia and the south sandwich islands' THEN 'GS'
    WHEN 'svalbard and jan mayen' THEN 'SJ'
    WHEN 'svalbard og jan mayen' THEN 'SJ'
    WHEN 'solomon islands' THEN 'SB'
    WHEN 'sierra leone' THEN 'SL'
    WHEN 'republic of sierra leone' THEN 'SL'
    WHEN 'el salvador' THEN 'SV'
    WHEN 'republic of el salvador' THEN 'SV'
    WHEN 'san marino' THEN 'SM'
    WHEN 'most serene republic of san marino' THEN 'SM'
    WHEN 'somalia' THEN 'SO'
    WHEN 'federal republic of somalia' THEN 'SO'
    WHEN 'saint pierre and miquelon' THEN 'PM'
    WHEN 'serbia' THEN 'RS'
    WHEN 'republic of serbia' THEN 'RS'
    WHEN 'south sudan' THEN 'SS'
    WHEN 'republic of south sudan' THEN 'SS'
    WHEN 'são tomé and príncipe' THEN 'ST'
    WHEN 'democratic republic of são tomé and príncipe' THEN 'ST'
    WHEN 'suriname' THEN 'SR'
    WHEN 'republic of suriname' THEN 'SR'
    WHEN 'slovakia' THEN 'SK'
    WHEN 'slovak republic' THEN 'SK'
    WHEN 'slovenia' THEN 'SI'
    WHEN 'republic of slovenia' THEN 'SI'
    WHEN 'sweden' THEN 'SE'
    WHEN 'kingdom of sweden' THEN 'SE'
    WHEN 'eswatini' THEN 'SZ'
    WHEN 'kingdom of eswatini' THEN 'SZ'
    WHEN 'sint maarten' THEN 'SX'
    WHEN 'seychelles' THEN 'SC'
    WHEN 'republic of seychelles' THEN 'SC'
    WHEN 'syria' THEN 'SY'
    WHEN 'syrian arab republic' THEN 'SY'
    WHEN 'turks and caicos islands' THEN 'TC'
    WHEN 'chad' THEN 'TD'
    WHEN 'republic of chad' THEN 'TD'
    WHEN 'togo' THEN 'TG'
    WHEN 'togolese republic' THEN 'TG'
    WHEN 'thailand' THEN 'TH'
    WHEN 'kingdom of thailand' THEN 'TH'
    WHEN 'tajikistan' THEN 'TJ'
    WHEN 'republic of tajikistan' THEN 'TJ'
    WHEN 'tokelau' THEN 'TK'
    WHEN 'turkmenistan' THEN 'TM'
    WHEN 'timor-leste' THEN 'TL'
    WHEN 'democratic republic of timor-leste' THEN 'TL'
    WHEN 'tonga' THEN 'TO'
    WHEN 'kingdom of tonga' THEN 'TO'
    WHEN 'trinidad and tobago' THEN 'TT'
    WHEN 'republic of trinidad and tobago' THEN 'TT'
    WHEN 'tunisia' THEN 'TN'
    WHEN 'tunisian republic' THEN 'TN'
    WHEN 'türkiye' THEN 'TR'
    WHEN 'republic of türkiye' THEN 'TR'
    WHEN 'tuvalu' THEN 'TV'
    WHEN 'taiwan' THEN 'TW'
    WHEN 'republic of china (taiwan)' THEN 'TW'
    WHEN 'tanzania' THEN 'TZ'
    WHEN 'united republic of tanzania' THEN 'TZ'
    WHEN 'uganda' THEN 'UG'
    WHEN 'republic of uganda' THEN 'UG'
    WHEN 'ukraine' THEN 'UA'
    WHEN 'united states minor outlying islands' THEN 'UM'
    WHEN 'uruguay' THEN 'UY'
    WHEN 'oriental republic of uruguay' THEN 'UY'
    WHEN 'united states' THEN 'US'
    WHEN 'united states of america' THEN 'US'
    WHEN 'uzbekistan' THEN 'UZ'
    WHEN 'republic of uzbekistan' THEN 'UZ'
    WHEN 'vatican city' THEN 'VA'
    WHEN 'vatican city state' THEN 'VA'
    WHEN 'saint vincent and the grenadines' THEN 'VC'
    WHEN 'venezuela' THEN 'VE'
    WHEN 'bolivarian republic of venezuela' THEN 'VE'
    WHEN 'british virgin islands' THEN 'VG'
    WHEN 'virgin islands' THEN 'VG'
    WHEN 'united states virgin islands' THEN 'VI'
    WHEN 'virgin islands of the united states' THEN 'VI'
    WHEN 'vietnam' THEN 'VN'
    WHEN 'socialist republic of vietnam' THEN 'VN'
    WHEN 'vanuatu' THEN 'VU'
    WHEN 'republic of vanuatu' THEN 'VU'
    WHEN 'wallis and futuna' THEN 'WF'
    WHEN 'territory of the wallis and futuna islands' THEN 'WF'
    WHEN 'samoa' THEN 'WS'
    WHEN 'independent state of samoa' THEN 'WS'
    WHEN 'yemen' THEN 'YE'
    WHEN 'republic of yemen' THEN 'YE'
    WHEN 'south africa' THEN 'ZA'
    WHEN 'republic of south africa' THEN 'ZA'
    WHEN 'zambia' THEN 'ZM'
    WHEN 'republic of zambia' THEN 'ZM'
    WHEN 'zimbabwe' THEN 'ZW'
    WHEN 'republic of zimbabwe' THEN 'ZW'
    WHEN 'aland islands' THEN 'AX'
    WHEN 'the bahamas' THEN 'BS'
    WHEN 'congo' THEN 'CG'
    WHEN 'cote d''ivoire (ivory coast)' THEN 'CI'
    WHEN 'east timor' THEN 'TL'
    WHEN 'fiji islands' THEN 'FJ'
    WHEN 'french southern territories' THEN 'TF'
    WHEN 'the gambia' THEN 'GM'
    WHEN 'guernsey and alderney' THEN 'GG'
    WHEN 'hong kong s.a.r.' THEN 'HK'
    WHEN 'macau s.a.r.' THEN 'MO'
    WHEN 'macedonia' THEN 'MK'
    WHEN 'man (isle of)' THEN 'IM'
    WHEN 'palestinian territory occupied' THEN 'PS'
    WHEN 'pitcairn island' THEN 'PN'
    WHEN 'reunion' THEN 'RE'
    WHEN 'saint helena' THEN 'SH'
    WHEN 'saint-barthelemy' THEN 'BL'
    WHEN 'saint-martin (french part)' THEN 'MF'
    WHEN 'sao tome and principe' THEN 'ST'
    WHEN 'svalbard and jan mayen islands' THEN 'SJ'
    WHEN 'swaziland' THEN 'SZ'
    WHEN 'turkey' THEN 'TR'
    WHEN 'vatican city state (holy see)' THEN 'VA'
    WHEN 'virgin islands (british)' THEN 'VG'
    WHEN 'virgin islands (us)' THEN 'VI'
    WHEN 'wallis and futuna islands' THEN 'WF'
    WHEN 'sint maarten (dutch part)' THEN 'SX'
  END
WHERE `isoCode` IS NULL;
ALTER TABLE `Country` MODIFY `isoCode` CHAR(2) NOT NULL;

-- AlterTable
ALTER TABLE `City` ADD COLUMN `lat` DOUBLE NULL,
    ADD COLUMN `lng` DOUBLE NULL,
    ADD COLUMN `regionId` INTEGER NULL,
    MODIFY `name` VARCHAR(120) NOT NULL;

-- AlterTable
-- v1 stored photos as base64 JSON; keep the data under a new name so
-- scripts/migrate-legacy-photos.ts can move it into ListingPhoto.
ALTER TABLE `Listing` CHANGE COLUMN `photos` `legacyPhotos` LONGTEXT NULL,
    ADD COLUMN `availableFrom` DATE NULL,
    ADD COLUMN `bathrooms` SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN `bedrooms` SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN `billsEstimate` DECIMAL(10, 2) NULL,
    ADD COLUMN `deposit` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `furnished` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `guestsAllowed` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lat` DOUBLE NULL,
    ADD COLUMN `lng` DOUBLE NULL,
    ADD COLUMN `minStayMonths` SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN `petsAllowed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sizeSqm` SMALLINT NULL,
    ADD COLUMN `smokingAllowed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `status` ENUM('ACTIVE', 'RENTED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `utilitiesIncluded` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `type` ENUM('DORM', 'APARTMENT', 'STUDIO', 'SHARED_ROOM', 'PRIVATE_ROOM') NOT NULL,
    MODIFY `title` VARCHAR(140) NOT NULL,
    MODIFY `address` VARCHAR(255) NOT NULL,
    MODIFY `price` DECIMAL(10, 2) NOT NULL,
    MODIFY `currency` CHAR(3) NOT NULL DEFAULT 'USD',
    MODIFY `capacityMin` SMALLINT NOT NULL DEFAULT 1,
    MODIFY `capacityMax` SMALLINT NOT NULL DEFAULT 1,
    MODIFY `currentOccupants` SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `RoommateRequest` ADD COLUMN `budgetShare` DECIMAL(10, 2) NULL,
    ADD COLUMN `decidedAt` DATETIME(3) NULL,
    ADD COLUMN `message` VARCHAR(600) NOT NULL DEFAULT '',
    ADD COLUMN `moveInDate` DATE NULL,
    ADD COLUMN `openRequesterId` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` ENUM('OPEN', 'MATCHED', 'CLOSED', 'WITHDRAWN') NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE `Conversation` ADD COLUMN `contextKey` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `lastMessagePreview` VARCHAR(160) NULL,
    ADD COLUMN `lastSenderId` INTEGER NULL,
    ADD COLUMN `roommateRequestId` INTEGER NULL;

-- AlterTable
ALTER TABLE `POI` CHANGE COLUMN `priceLevel` `priceTier` TINYINT NULL,
    ADD COLUMN `cuisine` VARCHAR(120) NULL,
    ADD COLUMN `openingHours` VARCHAR(255) NULL,
    ADD COLUMN `osmId` VARCHAR(64) NOT NULL,
    ADD COLUMN `tags` JSON NULL,
    ADD COLUMN `website` VARCHAR(255) NULL,
    MODIFY `cityId` INTEGER NULL,
    MODIFY `name` VARCHAR(200) NOT NULL,
    MODIFY `category` ENUM('RESTAURANT', 'CAFE', 'FAST_FOOD', 'SUPERMARKET', 'CONVENIENCE', 'HOSPITAL', 'CLINIC', 'PHARMACY', 'DOCTOR', 'BANK', 'ATM', 'TRANSIT', 'MOBILE_SHOP', 'LAUNDRY', 'GYM', 'UNIVERSITY', 'POST_OFFICE', 'POLICE', 'HOTEL', 'HOSTEL', 'GUEST_HOUSE', 'CAMP_SITE', 'ATTRACTION', 'MUSEUM', 'VIEWPOINT', 'GALLERY', 'HISTORIC', 'PARK', 'NIGHTLIFE', 'SHOPPING') NOT NULL,
    MODIFY `address` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Itinerary` ADD COLUMN `currency` CHAR(3) NOT NULL,
    ADD COLUMN `minViableBudget` DECIMAL(10, 2) NULL,
    ADD COLUMN `pace` ENUM('RELAXED', 'NORMAL', 'PACKED') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `pctActivities` TINYINT NOT NULL DEFAULT 20,
    ADD COLUMN `pctFood` TINYINT NOT NULL DEFAULT 30,
    ADD COLUMN `pctStay` TINYINT NOT NULL DEFAULT 40,
    ADD COLUMN `pctTransport` TINYINT NOT NULL DEFAULT 10,
    ADD COLUMN `roomsNeeded` SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN `shareToken` CHAR(32) NULL,
    ADD COLUMN `startDate` DATE NULL,
    ADD COLUMN `stayPreference` ENUM('ANY', 'HOSTEL', 'HOTEL', 'APARTMENT') NOT NULL DEFAULT 'ANY',
    ADD COLUMN `style` ENUM('BUDGET', 'BALANCED', 'COMFORT') NOT NULL DEFAULT 'BALANCED',
    ADD COLUMN `title` VARCHAR(120) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `days` SMALLINT NOT NULL,
    MODIFY `peopleCount` SMALLINT NOT NULL,
    MODIFY `budget` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `ItineraryItem` ADD COLUMN `kind` ENUM('STAY', 'FOOD', 'ACTIVITY', 'TRANSPORT') NOT NULL,
    ADD COLUMN `lat` DOUBLE NULL,
    ADD COLUMN `lng` DOUBLE NULL,
    ADD COLUMN `notes` VARCHAR(300) NULL,
    ADD COLUMN `position` SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN `title` VARCHAR(200) NOT NULL,
    MODIFY `dayNumber` SMALLINT NOT NULL,
    MODIFY `timeSlot` ENUM('STAY', 'MORNING', 'LUNCH', 'AFTERNOON', 'DINNER', 'EVENING') NOT NULL,
    MODIFY `estimatedCost` DECIMAL(10, 2) NOT NULL;

-- DropTable: v1 MySQL Message table was never used (chat bodies live in MongoDB).
DROP TABLE `Message`;

-- CreateTable
CREATE TABLE `UserProfile` (
    `userId` INTEGER NOT NULL,
    `occupation` ENUM('STUDENT', 'PROFESSIONAL', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `organization` VARCHAR(120) NULL,
    `destinationCityId` INTEGER NULL,
    `budgetMonthly` DECIMAL(10, 2) NULL,
    `budgetCurrency` CHAR(3) NULL,
    `moveInDate` DATE NULL,
    `bio` VARCHAR(600) NULL,
    `gender` ENUM('FEMALE', 'MALE', 'NON_BINARY', 'UNDISCLOSED') NOT NULL DEFAULT 'UNDISCLOSED',
    `smoking` ENUM('NON_SMOKER', 'OUTSIDE_ONLY', 'SMOKER') NOT NULL DEFAULT 'NON_SMOKER',
    `hasPets` BOOLEAN NOT NULL DEFAULT false,
    `okWithPets` BOOLEAN NOT NULL DEFAULT true,
    `socialStyle` ENUM('QUIET', 'BALANCED', 'SOCIAL') NOT NULL DEFAULT 'BALANCED',
    `sleepSchedule` ENUM('EARLY_BIRD', 'FLEXIBLE', 'NIGHT_OWL') NOT NULL DEFAULT 'FLEXIBLE',
    `roommateGender` ENUM('ANYONE', 'FEMALE_ONLY', 'MALE_ONLY') NOT NULL DEFAULT 'ANYONE',
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserProfile_destinationCityId_idx`(`destinationCityId`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Language` (
    `code` VARCHAR(8) NOT NULL,
    `name` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `Language_name_key`(`name`),
    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserLanguage` (
    `userId` INTEGER NOT NULL,
    `languageCode` VARCHAR(8) NOT NULL,

    INDEX `UserLanguage_languageCode_idx`(`languageCode`),
    PRIMARY KEY (`userId`, `languageCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessProfile` (
    `userId` INTEGER NOT NULL,
    `displayName` VARCHAR(120) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetToken_tokenHash_key`(`tokenHash`),
    INDEX `PasswordResetToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Region` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `isoCode` VARCHAR(10) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,

    INDEX `Region_countryId_name_idx`(`countryId`, `name`),
    UNIQUE INDEX `Region_countryId_isoCode_key`(`countryId`, `isoCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListingPhoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `storageKey` VARCHAR(255) NOT NULL,
    `position` SMALLINT NOT NULL DEFAULT 0,
    `caption` VARCHAR(140) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ListingPhoto_listingId_position_idx`(`listingId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Amenity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(40) NOT NULL,
    `label` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `Amenity_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListingAmenity` (
    `listingId` INTEGER NOT NULL,
    `amenityId` INTEGER NOT NULL,

    INDEX `ListingAmenity_amenityId_idx`(`amenityId`),
    PRIMARY KEY (`listingId`, `amenityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedListing` (
    `userId` INTEGER NOT NULL,
    `listingId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavedListing_listingId_idx`(`listingId`),
    PRIMARY KEY (`userId`, `listingId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListingView` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER NOT NULL,
    `viewerId` INTEGER NULL,
    `viewerKey` CHAR(64) NOT NULL,
    `viewedOn` DATE NOT NULL,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ListingView_viewerId_viewedAt_idx`(`viewerId`, `viewedAt`),
    UNIQUE INDEX `ListingView_listingId_viewerKey_viewedOn_key`(`listingId`, `viewerKey`, `viewedOn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Block` (
    `blockerId` INTEGER NOT NULL,
    `blockedId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Block_blockedId_idx`(`blockedId`),
    PRIMARY KEY (`blockerId`, `blockedId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporterId` INTEGER NOT NULL,
    `reportedUserId` INTEGER NULL,
    `listingId` INTEGER NULL,
    `reason` VARCHAR(60) NOT NULL,
    `details` VARCHAR(1000) NULL,
    `status` ENUM('OPEN', 'REVIEWED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `resolvedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `Report_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Report_reporterId_idx`(`reporterId`),
    INDEX `Report_reportedUserId_idx`(`reportedUserId`),
    INDEX `Report_listingId_idx`(`listingId`),
    INDEX `Report_resolvedById_idx`(`resolvedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PoiQueryCache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `areaKey` VARCHAR(64) NOT NULL,
    `category` ENUM('RESTAURANT', 'CAFE', 'FAST_FOOD', 'SUPERMARKET', 'CONVENIENCE', 'HOSPITAL', 'CLINIC', 'PHARMACY', 'DOCTOR', 'BANK', 'ATM', 'TRANSIT', 'MOBILE_SHOP', 'LAUNDRY', 'GYM', 'UNIVERSITY', 'POST_OFFICE', 'POLICE', 'HOTEL', 'HOSTEL', 'GUEST_HOUSE', 'CAMP_SITE', 'ATTRACTION', 'MUSEUM', 'VIEWPOINT', 'GALLERY', 'HISTORIC', 'PARK', 'NIGHTLIFE', 'SHOPPING') NOT NULL,
    `resultCount` INTEGER NOT NULL DEFAULT 0,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PoiQueryCache_areaKey_category_key`(`areaKey`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CostEstimate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `cityId` INTEGER NULL,
    `category` ENUM('RENT_SHARED_ROOM', 'RENT_STUDIO', 'RENT_ONE_BEDROOM', 'GROCERIES_MONTH', 'TRANSPORT_MONTH', 'TRANSPORT_DAY', 'PHONE_MONTH', 'MEAL', 'COFFEE', 'STAY_NIGHT', 'ATTRACTION_ENTRY') NOT NULL,
    `tier` TINYINT NOT NULL DEFAULT 0,
    `minPrice` DECIMAL(10, 2) NOT NULL,
    `maxPrice` DECIMAL(10, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `source` VARCHAR(200) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CostEstimate_cityId_category_idx`(`cityId`, `category`),
    UNIQUE INDEX `CostEstimate_countryId_cityId_category_tier_key`(`countryId`, `cityId`, `category`, `tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `base` CHAR(3) NOT NULL,
    `quote` CHAR(3) NOT NULL,
    `rate` DECIMAL(18, 8) NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`base`, `quote`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuideArticle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `cityId` INTEGER NULL,
    `category` ENUM('BASICS', 'HOUSING', 'HEALTHCARE', 'MONEY', 'GROCERIES', 'TRANSPORT', 'SIM', 'LEGAL', 'CULTURE') NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `summary` VARCHAR(400) NOT NULL,
    `body` TEXT NOT NULL,
    `sourceName` VARCHAR(120) NULL,
    `sourceUrl` VARCHAR(300) NULL,
    `position` SMALLINT NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuideArticle_countryId_category_position_idx`(`countryId`, `category`, `position`),
    INDEX `GuideArticle_cityId_idx`(`cityId`),
    UNIQUE INDEX `GuideArticle_countryId_slug_key`(`countryId`, `slug`),
    FULLTEXT INDEX `GuideArticle_title_summary_body_idx`(`title`, `summary`, `body`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `cityId` INTEGER NULL,
    `category` ENUM('BASICS', 'HOUSING', 'HEALTHCARE', 'MONEY', 'GROCERIES', 'TRANSPORT', 'SIM', 'LEGAL', 'CULTURE') NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `description` VARCHAR(600) NOT NULL,
    `dueWithinDays` SMALLINT NULL,
    `link` VARCHAR(300) NULL,
    `position` SMALLINT NOT NULL DEFAULT 0,

    INDEX `ChecklistTemplate_countryId_position_idx`(`countryId`, `position`),
    INDEX `ChecklistTemplate_cityId_idx`(`cityId`),
    UNIQUE INDEX `ChecklistTemplate_countryId_title_key`(`countryId`, `title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserChecklistProgress` (
    `userId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserChecklistProgress_itemId_idx`(`itemId`),
    PRIMARY KEY (`userId`, `itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SimProvider` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `isMvno` BOOLEAN NOT NULL DEFAULT false,
    `network` VARCHAR(80) NULL,
    `website` VARCHAR(200) NULL,
    `whereToBuy` VARCHAR(300) NOT NULL,
    `documentsNeeded` VARCHAR(300) NOT NULL,
    `studentTip` VARCHAR(300) NULL,
    `touristTip` VARCHAR(300) NULL,

    UNIQUE INDEX `SimProvider_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SimPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerId` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `kind` ENUM('PREPAID', 'POSTPAID') NOT NULL,
    `priceMonthly` DECIMAL(8, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `dataGb` DECIMAL(6, 1) NULL,
    `euRoaming` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(300) NULL,

    INDEX `SimPlan_providerId_kind_idx`(`providerId`, `kind`),
    UNIQUE INDEX `SimPlan_providerId_name_key`(`providerId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportMode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `mode` ENUM('TRAIN', 'TRAM', 'BUS', 'METRO', 'BOAT', 'CABLE_CAR', 'BIKE', 'WALK') NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` VARCHAR(1000) NOT NULL,
    `howToBuy` VARCHAR(600) NULL,
    `apps` VARCHAR(200) NULL,
    `priceRange` VARCHAR(120) NULL,
    `position` SMALLINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `TransportMode_countryId_mode_key`(`countryId`, `mode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportPass` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `cityId` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(600) NOT NULL,
    `price` DECIMAL(8, 2) NULL,
    `currency` CHAR(3) NOT NULL,
    `validity` VARCHAR(80) NOT NULL,
    `audience` ENUM('EVERYONE', 'YOUTH', 'STUDENT', 'TOURIST', 'SENIOR') NOT NULL DEFAULT 'EVERYONE',
    `url` VARCHAR(300) NULL,

    INDEX `TransportPass_countryId_audience_idx`(`countryId`, `audience`),
    INDEX `TransportPass_cityId_idx`(`cityId`),
    UNIQUE INDEX `TransportPass_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyNumber` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `service` VARCHAR(60) NOT NULL,
    `number` VARCHAR(20) NOT NULL,
    `notes` VARCHAR(200) NULL,

    UNIQUE INDEX `EmergencyNumber_countryId_service_key`(`countryId`, `service`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupermarketChain` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `priceTier` TINYINT NOT NULL,
    `notes` VARCHAR(300) NULL,
    `website` VARCHAR(200) NULL,

    UNIQUE INDEX `SupermarketChain_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bank` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `kind` VARCHAR(40) NOT NULL,
    `studentAccount` BOOLEAN NOT NULL DEFAULT false,
    `monthlyFee` DECIMAL(8, 2) NULL,
    `currency` CHAR(3) NOT NULL,
    `notes` VARCHAR(300) NULL,
    `website` VARCHAR(200) NULL,

    UNIQUE INDEX `Bank_countryId_name_key`(`countryId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItineraryInterest` (
    `itineraryId` INTEGER NOT NULL,
    `interest` ENUM('CULTURE', 'FOOD', 'NATURE', 'NIGHTLIFE', 'SHOPPING', 'ADVENTURE', 'FAMILY') NOT NULL,

    PRIMARY KEY (`itineraryId`, `interest`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tableName` VARCHAR(64) NOT NULL,
    `rowId` INTEGER NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_tableName_rowId_changedAt_idx`(`tableName`, `rowId`, `changedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `User_role_isActive_idx` ON `User`(`role`, `isActive`);

-- CreateIndex
CREATE UNIQUE INDEX `Country_isoCode_key` ON `Country`(`isoCode`);

-- CreateIndex
CREATE INDEX `City_regionId_name_idx` ON `City`(`regionId`, `name`);

-- CreateIndex
CREATE INDEX `City_countryId_name_idx` ON `City`(`countryId`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `City_countryId_regionId_name_key` ON `City`(`countryId`, `regionId`, `name`);

-- CreateIndex
CREATE INDEX `Listing_cityId_status_price_idx` ON `Listing`(`cityId`, `status`, `price`);

-- CreateIndex
CREATE INDEX `Listing_ownerId_status_idx` ON `Listing`(`ownerId`, `status`);

-- CreateIndex
CREATE INDEX `Listing_status_createdAt_idx` ON `Listing`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Listing_type_idx` ON `Listing`(`type`);

-- CreateIndex
CREATE INDEX `Listing_availableFrom_idx` ON `Listing`(`availableFrom`);

-- CreateIndex
CREATE INDEX `Listing_lat_lng_idx` ON `Listing`(`lat`, `lng`);

-- CreateIndex
CREATE FULLTEXT INDEX `Listing_title_description_idx` ON `Listing`(`title`, `description`);

-- CreateIndex
CREATE INDEX `RoommateRequest_listingId_status_idx` ON `RoommateRequest`(`listingId`, `status`);

-- CreateIndex
CREATE INDEX `RoommateRequest_requesterId_status_idx` ON `RoommateRequest`(`requesterId`, `status`);

-- CreateIndex
CREATE UNIQUE INDEX `RoommateRequest_listingId_openRequesterId_key` ON `RoommateRequest`(`listingId`, `openRequesterId`);

-- CreateIndex
CREATE INDEX `Conversation_userBId_lastMessageAt_idx` ON `Conversation`(`userBId`, `lastMessageAt`);

-- CreateIndex
CREATE INDEX `Conversation_userAId_lastMessageAt_idx` ON `Conversation`(`userAId`, `lastMessageAt`);

-- CreateIndex
CREATE INDEX `Conversation_listingId_idx` ON `Conversation`(`listingId`);

-- CreateIndex
CREATE INDEX `Conversation_roommateRequestId_idx` ON `Conversation`(`roommateRequestId`);

-- CreateIndex
CREATE UNIQUE INDEX `Conversation_userAId_userBId_contextKey_key` ON `Conversation`(`userAId`, `userBId`, `contextKey`);

-- CreateIndex
CREATE UNIQUE INDEX `POI_osmId_key` ON `POI`(`osmId`);

-- CreateIndex
CREATE INDEX `POI_cityId_category_idx` ON `POI`(`cityId`, `category`);

-- CreateIndex
CREATE INDEX `POI_category_lat_lng_idx` ON `POI`(`category`, `lat`, `lng`);

-- CreateIndex
CREATE INDEX `POI_lat_lng_idx` ON `POI`(`lat`, `lng`);

-- CreateIndex
CREATE UNIQUE INDEX `Itinerary_shareToken_key` ON `Itinerary`(`shareToken`);

-- CreateIndex
CREATE INDEX `Itinerary_userId_createdAt_idx` ON `Itinerary`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Itinerary_cityId_idx` ON `Itinerary`(`cityId`);

-- CreateIndex
CREATE INDEX `ItineraryItem_itineraryId_dayNumber_position_idx` ON `ItineraryItem`(`itineraryId`, `dayNumber`, `position`);

-- CreateIndex
CREATE INDEX `ItineraryItem_poiId_idx` ON `ItineraryItem`(`poiId`);

-- CreateIndex
CREATE INDEX `ItineraryItem_listingId_idx` ON `ItineraryItem`(`listingId`);

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_destinationCityId_fkey` FOREIGN KEY (`destinationCityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserLanguage` ADD CONSTRAINT `UserLanguage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserLanguage` ADD CONSTRAINT `UserLanguage_languageCode_fkey` FOREIGN KEY (`languageCode`) REFERENCES `Language`(`code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BusinessProfile` ADD CONSTRAINT `BusinessProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Region` ADD CONSTRAINT `Region_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `City` ADD CONSTRAINT `City_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Listing` ADD CONSTRAINT `Listing_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingPhoto` ADD CONSTRAINT `ListingPhoto_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingAmenity` ADD CONSTRAINT `ListingAmenity_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingAmenity` ADD CONSTRAINT `ListingAmenity_amenityId_fkey` FOREIGN KEY (`amenityId`) REFERENCES `Amenity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedListing` ADD CONSTRAINT `SavedListing_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedListing` ADD CONSTRAINT `SavedListing_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingView` ADD CONSTRAINT `ListingView_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingView` ADD CONSTRAINT `ListingView_viewerId_fkey` FOREIGN KEY (`viewerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoommateRequest` ADD CONSTRAINT `RoommateRequest_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoommateRequest` ADD CONSTRAINT `RoommateRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_userAId_fkey` FOREIGN KEY (`userAId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_userBId_fkey` FOREIGN KEY (`userBId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_roommateRequestId_fkey` FOREIGN KEY (`roommateRequestId`) REFERENCES `RoommateRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `POI` ADD CONSTRAINT `POI_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CostEstimate` ADD CONSTRAINT `CostEstimate_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CostEstimate` ADD CONSTRAINT `CostEstimate_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuideArticle` ADD CONSTRAINT `GuideArticle_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuideArticle` ADD CONSTRAINT `GuideArticle_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTemplate` ADD CONSTRAINT `ChecklistTemplate_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTemplate` ADD CONSTRAINT `ChecklistTemplate_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserChecklistProgress` ADD CONSTRAINT `UserChecklistProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserChecklistProgress` ADD CONSTRAINT `UserChecklistProgress_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SimProvider` ADD CONSTRAINT `SimProvider_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SimPlan` ADD CONSTRAINT `SimPlan_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `SimProvider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMode` ADD CONSTRAINT `TransportMode_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportPass` ADD CONSTRAINT `TransportPass_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportPass` ADD CONSTRAINT `TransportPass_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyNumber` ADD CONSTRAINT `EmergencyNumber_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupermarketChain` ADD CONSTRAINT `SupermarketChain_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bank` ADD CONSTRAINT `Bank_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Itinerary` ADD CONSTRAINT `Itinerary_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItineraryInterest` ADD CONSTRAINT `ItineraryInterest_itineraryId_fkey` FOREIGN KEY (`itineraryId`) REFERENCES `Itinerary`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItineraryItem` ADD CONSTRAINT `ItineraryItem_itineraryId_fkey` FOREIGN KEY (`itineraryId`) REFERENCES `Itinerary`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

