-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2022. Ápr 29. 23:37
-- Kiszolgáló verziója: 10.4.21-MariaDB
-- PHP verzió: 8.0.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `estidb`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `room`
--

CREATE TABLE `room` (
  `id` tinyint(4) NOT NULL,
  `typeID` tinyint(4) NOT NULL,
  `space` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- A tábla adatainak kiíratása `room`
--

INSERT INTO `room` (`id`, `typeID`, `space`) VALUES
(1, 1, NULL),
(2, 1, NULL),
(3, 1, NULL),
(4, 1, NULL),
(5, 1, NULL),
(6, 1, NULL),
(7, 2, NULL),
(8, 2, NULL),
(9, 2, NULL),
(10, 2, NULL),
(11, 2, NULL),
(12, 2, NULL),
(13, 2, NULL),
(14, 2, NULL),
(15, 2, NULL),
(16, 2, NULL),
(17, 3, NULL),
(18, 3, NULL),
(19, 3, NULL),
(20, 3, NULL),
(21, 4, NULL),
(22, 4, NULL),
(23, 4, NULL),
(24, 4, NULL),
(25, 4, NULL),
(26, 4, NULL),
(27, 5, NULL),
(28, 5, NULL),
(29, 5, NULL);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `room_reservation`
--

CREATE TABLE `room_reservation` (
  `id` int(11) NOT NULL,
  `roomID` tinyint(4) NOT NULL,
  `guestID` int(11) NOT NULL,
  `reservation` datetime NOT NULL,
  `arrival` date NOT NULL,
  `leaving` date NOT NULL,
  `adults` tinyint(4) NOT NULL,
  `children` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- A tábla adatainak kiíratása `room_reservation`
--

INSERT INTO `room_reservation` (`id`, `roomID`, `guestID`, `reservation`, `arrival`, `leaving`, `adults`, `children`) VALUES
(1, 25, 4, '2022-04-22 00:00:00', '2022-04-24', '2022-04-30', 2, 4),
(2, 26, 5, '2022-04-22 18:38:09', '2022-04-27', '2022-04-28', 2, 2),
(3, 24, 4, '2022-04-22 22:19:09', '2022-05-06', '2022-05-08', 2, 4),
(4, 24, 5, '2022-04-22 22:19:10', '2022-05-08', '2022-05-12', 2, 2),
(5, 24, 2, '2022-04-27 16:09:28', '2022-04-27', '2022-04-28', 6, 0),
(6, 22, 3, '2022-04-27 17:26:02', '2022-04-27', '2022-04-28', 4, 2),
(7, 21, 2, '2022-04-27 17:28:35', '2022-04-27', '2022-04-28', 3, 2),
(8, 1, 6, '2022-04-29 21:39:42', '2022-04-29', '2022-04-30', 1, 0),
(9, 2, 6, '2022-04-29 22:24:31', '2022-04-29', '2022-04-30', 1, 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `room_type`
--

CREATE TABLE `room_type` (
  `id` tinyint(4) NOT NULL,
  `space` tinyint(4) NOT NULL,
  `langID` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- A tábla adatainak kiíratása `room_type`
--

INSERT INTO `room_type` (`id`, `space`, `langID`) VALUES
(1, 1, 'singleRoom'),
(2, 2, 'doubleRoom'),
(3, 4, 'family'),
(4, 6, 'suites'),
(5, 2, 'honey');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user`
--

CREATE TABLE `user` (
  `id` tinyint(4) NOT NULL,
  `type` char(1) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `prefix_name` varchar(20) DEFAULT NULL,
  `postfix_name` varchar(20) DEFAULT NULL,
  `born` date NOT NULL,
  `gender` char(1) NOT NULL,
  `email` varchar(50) NOT NULL,
  `user` varchar(20) NOT NULL,
  `password` varchar(20) NOT NULL,
  `valid` tinyint(1) NOT NULL DEFAULT 1,
  `last_logon` timestamp NULL DEFAULT NULL,
  `attempts` tinyint(4) NOT NULL DEFAULT 0,
  `last_attempt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- A tábla adatainak kiíratása `user`
--

INSERT INTO `user` (`id`, `type`, `first_name`, `last_name`, `middle_name`, `prefix_name`, `postfix_name`, `born`, `gender`, `email`, `user`, `password`, `valid`, `last_logon`, `attempts`, `last_attempt`) VALUES
(1, 'A', 'Attila', 'Ódry', NULL, NULL, NULL, '1964-03-08', 'M', '', 'a', 'a', 1, '2022-04-29 20:23:35', 0, '2022-04-29 07:38:38'),
(2, 'A', 'Ferenc', 'Hangai', NULL, NULL, NULL, '1967-07-18', 'M', '', 'ferko', '1234', 1, '2022-04-29 12:29:51', 0, NULL),
(3, 'A', 'Károly', 'Zemankó', 'Róbert', NULL, NULL, '1997-05-23', 'M', '', 'karcsi', 'teve', 1, '2022-04-27 15:27:45', 1, '2022-04-29 12:29:35'),
(4, 'G', 'Viktor', 'Orbán', NULL, NULL, NULL, '2022-04-15', 'M', 'viktor.orban@gmail.com', 'viki', '1234', 1, NULL, 0, NULL),
(5, 'G', 'Ferenc', 'Gyurcsány', NULL, NULL, NULL, '1970-04-15', 'M', 'ferenc.gyurcsany@gmail.com', 'gyuri', '1234', 1, NULL, 0, NULL);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`id`),
  ADD KEY `type` (`typeID`);

--
-- A tábla indexei `room_reservation`
--
ALTER TABLE `room_reservation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room` (`roomID`),
  ADD KEY `user` (`guestID`);

--
-- A tábla indexei `room_type`
--
ALTER TABLE `room_type`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `login` (`user`,`password`) USING BTREE,
  ADD UNIQUE KEY `user` (`user`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `room`
--
ALTER TABLE `room`
  MODIFY `id` tinyint(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT a táblához `room_reservation`
--
ALTER TABLE `room_reservation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT a táblához `room_type`
--
ALTER TABLE `room_type`
  MODIFY `id` tinyint(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `user`
--
ALTER TABLE `user`
  MODIFY `id` tinyint(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
