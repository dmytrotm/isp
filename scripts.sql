USE [master]
GO
/****** Object:  Database [isp]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE DATABASE [isp]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'isp', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\isp.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'isp_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\isp_log.ldf' , SIZE = 73728KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [isp] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [isp].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [isp] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [isp] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [isp] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [isp] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [isp] SET ARITHABORT OFF 
GO
ALTER DATABASE [isp] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [isp] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [isp] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [isp] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [isp] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [isp] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [isp] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [isp] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [isp] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [isp] SET  ENABLE_BROKER 
GO
ALTER DATABASE [isp] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [isp] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [isp] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [isp] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [isp] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [isp] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [isp] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [isp] SET RECOVERY FULL 
GO
ALTER DATABASE [isp] SET  MULTI_USER 
GO
ALTER DATABASE [isp] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [isp] SET DB_CHAINING OFF 
GO
ALTER DATABASE [isp] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [isp] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [isp] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [isp] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'isp', N'ON'
GO
ALTER DATABASE [isp] SET QUERY_STORE = ON
GO
ALTER DATABASE [isp] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [isp]
GO
/****** Object:  Table [dbo].[api_address]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_address](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[apartment] [nvarchar](50) NULL,
	[building] [nvarchar](255) NOT NULL,
	[street] [nvarchar](255) NOT NULL,
	[city] [nvarchar](100) NOT NULL,
	[customer_id] [bigint] NOT NULL,
	[region_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_connectionrequest]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_connectionrequest](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetimeoffset](7) NOT NULL,
	[updated_at] [datetimeoffset](7) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[address_id] [bigint] NULL,
	[customer_id] [bigint] NOT NULL,
	[status_id] [bigint] NOT NULL,
	[tariff_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_connectionrequestassignment]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_connectionrequestassignment](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[connection_request_id] [bigint] NOT NULL,
	[employee_id] [bigint] NOT NULL,
	[status] [varchar](50) NULL,
	[notes] [nvarchar](max) NULL,
	[assigned_at] [datetime] NOT NULL,
	[role] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_contract]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_contract](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetimeoffset](7) NOT NULL,
	[updated_at] [datetimeoffset](7) NOT NULL,
	[start_date] [datetimeoffset](7) NOT NULL,
	[end_date] [datetimeoffset](7) NOT NULL,
	[address_id] [bigint] NOT NULL,
	[connection_request_id] [bigint] NOT NULL,
	[customer_id] [bigint] NOT NULL,
	[service_id] [bigint] NOT NULL,
	[tariff_id] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[connection_request_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_contractequipment]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_contractequipment](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[assigned_at] [datetimeoffset](7) NOT NULL,
	[contract_id] [bigint] NOT NULL,
	[equipment_id] [bigint] NOT NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_customer]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_customer](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[phone_number] [nvarchar](13) NOT NULL,
	[balance] [numeric](10, 2) NOT NULL,
	[preferred_notification] [nvarchar](20) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[status_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[phone_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_employee]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_employee](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[role_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_employeerole]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_employeerole](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_equipment]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_equipment](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NULL,
	[price] [numeric](10, 2) NOT NULL,
	[stock_quantity] [int] NOT NULL,
	[state] [nvarchar](20) NOT NULL,
	[category_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_equipmentcategory]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_equipmentcategory](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_invoice]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_invoice](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[amount] [numeric](10, 2) NOT NULL,
	[issue_date] [datetimeoffset](7) NOT NULL,
	[due_date] [datetimeoffset](7) NOT NULL,
	[description] [nvarchar](max) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[contract_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_networkusage]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_networkusage](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[date] [date] NOT NULL,
	[download_gb] [numeric](10, 2) NOT NULL,
	[upload_gb] [numeric](10, 2) NOT NULL,
	[contract_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_payment]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_payment](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[amount] [numeric](10, 2) NOT NULL,
	[payment_date] [datetimeoffset](7) NOT NULL,
	[method_id] [bigint] NOT NULL,
	[customer_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_paymentmethod]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_paymentmethod](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[method] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[method] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_region]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_region](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_service]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_service](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NOT NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_status]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_status](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[context_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_statuscontext]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_statuscontext](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[context] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [api_statuscontext_context_f2f87b3f_uniq] UNIQUE NONCLUSTERED 
(
	[context] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_supportticket]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_supportticket](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[subject] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NOT NULL,
	[created_at] [datetimeoffset](7) NOT NULL,
	[updated_at] [datetimeoffset](7) NOT NULL,
	[status_id] [bigint] NOT NULL,
	[assigned_to_id] [bigint] NULL,
	[customer_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_tariff]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_tariff](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[price] [numeric](10, 2) NOT NULL,
	[description] [nvarchar](max) NOT NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_tariffservice]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_tariffservice](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[service_id] [bigint] NOT NULL,
	[tariff_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_user]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_user](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[password] [nvarchar](128) NOT NULL,
	[last_login] [datetimeoffset](7) NULL,
	[is_superuser] [bit] NOT NULL,
	[email] [nvarchar](254) NOT NULL,
	[first_name] [nvarchar](50) NOT NULL,
	[last_name] [nvarchar](50) NOT NULL,
	[is_active] [bit] NOT NULL,
	[is_staff] [bit] NOT NULL,
	[created_at] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_user_groups]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_user_groups](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[group_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[api_user_user_permissions]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[api_user_user_permissions](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[permission_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[auth_group]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[auth_group](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](150) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [auth_group_name_a6ea08ec_uniq] UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[auth_group_permissions]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[auth_group_permissions](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[group_id] [int] NOT NULL,
	[permission_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[auth_permission]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[auth_permission](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[content_type_id] [int] NOT NULL,
	[codename] [nvarchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_admin_log]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_admin_log](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[action_time] [datetimeoffset](7) NOT NULL,
	[object_id] [nvarchar](max) NULL,
	[object_repr] [nvarchar](200) NOT NULL,
	[action_flag] [smallint] NOT NULL,
	[change_message] [nvarchar](max) NOT NULL,
	[content_type_id] [int] NULL,
	[user_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_celery_beat_clockedschedule]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_celery_beat_clockedschedule](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[clocked_time] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_celery_beat_crontabschedule]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_celery_beat_crontabschedule](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[minute] [nvarchar](240) NOT NULL,
	[hour] [nvarchar](96) NOT NULL,
	[day_of_week] [nvarchar](64) NOT NULL,
	[day_of_month] [nvarchar](124) NOT NULL,
	[month_of_year] [nvarchar](64) NOT NULL,
	[timezone] [nvarchar](63) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_celery_beat_intervalschedule]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_celery_beat_intervalschedule](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[every] [int] NOT NULL,
	[period] [nvarchar](24) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_celery_beat_periodictask]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_celery_beat_periodictask](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](200) NOT NULL,
	[task] [nvarchar](200) NOT NULL,
	[args] [nvarchar](max) NOT NULL,
	[kwargs] [nvarchar](max) NOT NULL,
	[queue] [nvarchar](200) NULL,
	[exchange] [nvarchar](200) NULL,
	[routing_key] [nvarchar](200) NULL,
	[expires] [datetimeoffset](7) NULL,
	[enabled] [bit] NOT NULL,
	[last_run_at] [datetimeoffset](7) NULL,
	[total_run_count] [int] NOT NULL,
	[date_changed] [datetimeoffset](7) NOT NULL,
	[description] [nvarchar](max) NOT NULL,
	[crontab_id] [int] NULL,
	[interval_id] [int] NULL,
	[solar_id] [int] NULL,
	[one_off] [bit] NOT NULL,
	[start_time] [datetimeoffset](7) NULL,
	[priority] [int] NULL,
	[headers] [nvarchar](max) NOT NULL,
	[clocked_id] [int] NULL,
	[expire_seconds] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_celery_beat_periodictasks]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_celery_beat_periodictasks](
	[ident] [smallint] NOT NULL,
	[last_update] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ident] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_celery_beat_solarschedule]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_celery_beat_solarschedule](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[event] [nvarchar](24) NOT NULL,
	[latitude] [numeric](9, 6) NOT NULL,
	[longitude] [numeric](9, 6) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_content_type]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_content_type](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[app_label] [nvarchar](100) NOT NULL,
	[model] [nvarchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_migrations]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_migrations](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[app] [nvarchar](255) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[applied] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[django_session]    Script Date: 4/26/2025 2:55:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[django_session](
	[session_key] [nvarchar](40) NOT NULL,
	[session_data] [nvarchar](max) NOT NULL,
	[expire_date] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[session_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [api_address_customer_id_f943f572]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_address_customer_id_f943f572] ON [dbo].[api_address]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_address_region_id_12a530db]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_address_region_id_12a530db] ON [dbo].[api_address]
(
	[region_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_connect_custome_dd9eda_idx]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_connect_custome_dd9eda_idx] ON [dbo].[api_connectionrequest]
(
	[customer_id] ASC,
	[status_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_connectionrequest_address_id_f752ad91]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_connectionrequest_address_id_f752ad91] ON [dbo].[api_connectionrequest]
(
	[address_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_connectionrequest_customer_id_81581390]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_connectionrequest_customer_id_81581390] ON [dbo].[api_connectionrequest]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_connectionrequest_status_id_8770662a]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_connectionrequest_status_id_8770662a] ON [dbo].[api_connectionrequest]
(
	[status_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_connectionrequest_tariff_id_acfc26c7]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_connectionrequest_tariff_id_acfc26c7] ON [dbo].[api_connectionrequest]
(
	[tariff_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_contrac_custome_cbccd2_idx]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_contrac_custome_cbccd2_idx] ON [dbo].[api_contract]
(
	[customer_id] ASC,
	[start_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_contract_address_id_1e457034]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_contract_address_id_1e457034] ON [dbo].[api_contract]
(
	[address_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_contract_customer_id_d6fb9327]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_contract_customer_id_d6fb9327] ON [dbo].[api_contract]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_contract_service_id_34e0a218]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_contract_service_id_34e0a218] ON [dbo].[api_contract]
(
	[service_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_contract_tariff_id_5d13bf19]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_contract_tariff_id_5d13bf19] ON [dbo].[api_contract]
(
	[tariff_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_contractequipment_contract_id_09c1b7e6]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_contractequipment_contract_id_09c1b7e6] ON [dbo].[api_contractequipment]
(
	[contract_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_contractequipment_equipment_id_2e6487fc]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_contractequipment_equipment_id_2e6487fc] ON [dbo].[api_contractequipment]
(
	[equipment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [api_custome_phone_n_f7efe2_idx]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_custome_phone_n_f7efe2_idx] ON [dbo].[api_customer]
(
	[phone_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_customer_status_id_02990bff]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_customer_status_id_02990bff] ON [dbo].[api_customer]
(
	[status_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_employee_role_id_f7c7c850]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_employee_role_id_f7c7c850] ON [dbo].[api_employee]
(
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_equipment_category_id_12b9f04b]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_equipment_category_id_12b9f04b] ON [dbo].[api_equipment]
(
	[category_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_invoice_contract_id_2d64c4c5]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_invoice_contract_id_2d64c4c5] ON [dbo].[api_invoice]
(
	[contract_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [api_invoice_status_4cbe4f_idx]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_invoice_status_4cbe4f_idx] ON [dbo].[api_invoice]
(
	[status] ASC,
	[due_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_networkusage_contract_id_51ae100d]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_networkusage_contract_id_51ae100d] ON [dbo].[api_networkusage]
(
	[contract_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_networkusage_contract_id_date_0ec5cedc_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [api_networkusage_contract_id_date_0ec5cedc_uniq] ON [dbo].[api_networkusage]
(
	[contract_id] ASC,
	[date] ASC
)
WHERE ([contract_id] IS NOT NULL AND [date] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_payment_customer_id_477a0340]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_payment_customer_id_477a0340] ON [dbo].[api_payment]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_payment_method_id_2472ffba]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_payment_method_id_2472ffba] ON [dbo].[api_payment]
(
	[method_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_status_context_id_9c96ff3c]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_status_context_id_9c96ff3c] ON [dbo].[api_status]
(
	[context_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [api_status_status_context_id_3f78d25c_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [api_status_status_context_id_3f78d25c_uniq] ON [dbo].[api_status]
(
	[status] ASC,
	[context_id] ASC
)
WHERE ([status] IS NOT NULL AND [context_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_supportticket_assigned_to_id_58ef3c94]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_supportticket_assigned_to_id_58ef3c94] ON [dbo].[api_supportticket]
(
	[assigned_to_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_supportticket_customer_id_9ada056a]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_supportticket_customer_id_9ada056a] ON [dbo].[api_supportticket]
(
	[customer_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_supportticket_status_id_1408f108]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_supportticket_status_id_1408f108] ON [dbo].[api_supportticket]
(
	[status_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_tariffservice_service_id_5af61b23]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_tariffservice_service_id_5af61b23] ON [dbo].[api_tariffservice]
(
	[service_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_tariffservice_tariff_id_5ef83521]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_tariffservice_tariff_id_5ef83521] ON [dbo].[api_tariffservice]
(
	[tariff_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_tariffservice_tariff_id_service_id_509f1d4c_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [api_tariffservice_tariff_id_service_id_509f1d4c_uniq] ON [dbo].[api_tariffservice]
(
	[tariff_id] ASC,
	[service_id] ASC
)
WHERE ([tariff_id] IS NOT NULL AND [service_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [api_user_email_a7eefd_idx]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_user_email_a7eefd_idx] ON [dbo].[api_user]
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_user_groups_group_id_3af85785]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_user_groups_group_id_3af85785] ON [dbo].[api_user_groups]
(
	[group_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_user_groups_user_id_a5ff39fa]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_user_groups_user_id_a5ff39fa] ON [dbo].[api_user_groups]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_user_groups_user_id_group_id_9c7ddfb5_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [api_user_groups_user_id_group_id_9c7ddfb5_uniq] ON [dbo].[api_user_groups]
(
	[user_id] ASC,
	[group_id] ASC
)
WHERE ([user_id] IS NOT NULL AND [group_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_user_user_permissions_permission_id_305b7fea]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_user_user_permissions_permission_id_305b7fea] ON [dbo].[api_user_user_permissions]
(
	[permission_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_user_user_permissions_user_id_f3945d65]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [api_user_user_permissions_user_id_f3945d65] ON [dbo].[api_user_user_permissions]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [api_user_user_permissions_user_id_permission_id_a06dd704_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [api_user_user_permissions_user_id_permission_id_a06dd704_uniq] ON [dbo].[api_user_user_permissions]
(
	[user_id] ASC,
	[permission_id] ASC
)
WHERE ([user_id] IS NOT NULL AND [permission_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [auth_group_permissions_group_id_b120cbf9]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [auth_group_permissions_group_id_b120cbf9] ON [dbo].[auth_group_permissions]
(
	[group_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [auth_group_permissions_group_id_permission_id_0cd325b0_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [auth_group_permissions_group_id_permission_id_0cd325b0_uniq] ON [dbo].[auth_group_permissions]
(
	[group_id] ASC,
	[permission_id] ASC
)
WHERE ([group_id] IS NOT NULL AND [permission_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [auth_group_permissions_permission_id_84c5c92e]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [auth_group_permissions_permission_id_84c5c92e] ON [dbo].[auth_group_permissions]
(
	[permission_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [auth_permission_content_type_id_2f476e4b]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [auth_permission_content_type_id_2f476e4b] ON [dbo].[auth_permission]
(
	[content_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [auth_permission_content_type_id_codename_01ab375a_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [auth_permission_content_type_id_codename_01ab375a_uniq] ON [dbo].[auth_permission]
(
	[content_type_id] ASC,
	[codename] ASC
)
WHERE ([content_type_id] IS NOT NULL AND [codename] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [django_admin_log_content_type_id_c4bce8eb]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [django_admin_log_content_type_id_c4bce8eb] ON [dbo].[django_admin_log]
(
	[content_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [django_admin_log_user_id_c564eba6]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [django_admin_log_user_id_c564eba6] ON [dbo].[django_admin_log]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [django_celery_beat_periodictask_clocked_id_47a69f82]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [django_celery_beat_periodictask_clocked_id_47a69f82] ON [dbo].[django_celery_beat_periodictask]
(
	[clocked_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [django_celery_beat_periodictask_crontab_id_d3cba168]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [django_celery_beat_periodictask_crontab_id_d3cba168] ON [dbo].[django_celery_beat_periodictask]
(
	[crontab_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [django_celery_beat_periodictask_interval_id_a8ca27da]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [django_celery_beat_periodictask_interval_id_a8ca27da] ON [dbo].[django_celery_beat_periodictask]
(
	[interval_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [django_celery_beat_periodictask_solar_id_a87ce72c]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [django_celery_beat_periodictask_solar_id_a87ce72c] ON [dbo].[django_celery_beat_periodictask]
(
	[solar_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [django_celery_beat_solarschedule_event_latitude_longitude_ba64999a_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [django_celery_beat_solarschedule_event_latitude_longitude_ba64999a_uniq] ON [dbo].[django_celery_beat_solarschedule]
(
	[event] ASC,
	[latitude] ASC,
	[longitude] ASC
)
WHERE ([event] IS NOT NULL AND [latitude] IS NOT NULL AND [longitude] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [django_content_type_app_label_model_76bd3d3b_uniq]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [django_content_type_app_label_model_76bd3d3b_uniq] ON [dbo].[django_content_type]
(
	[app_label] ASC,
	[model] ASC
)
WHERE ([app_label] IS NOT NULL AND [model] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [django_session_expire_date_a5c62663]    Script Date: 4/26/2025 2:55:49 PM ******/
CREATE NONCLUSTERED INDEX [django_session_expire_date_a5c62663] ON [dbo].[django_session]
(
	[expire_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[api_address]  WITH CHECK ADD  CONSTRAINT [api_address_customer_id_f943f572_fk_api_customer_id] FOREIGN KEY([customer_id])
REFERENCES [dbo].[api_customer] ([id])
GO
ALTER TABLE [dbo].[api_address] CHECK CONSTRAINT [api_address_customer_id_f943f572_fk_api_customer_id]
GO
ALTER TABLE [dbo].[api_address]  WITH CHECK ADD  CONSTRAINT [api_address_region_id_12a530db_fk_api_region_id] FOREIGN KEY([region_id])
REFERENCES [dbo].[api_region] ([id])
GO
ALTER TABLE [dbo].[api_address] CHECK CONSTRAINT [api_address_region_id_12a530db_fk_api_region_id]
GO
ALTER TABLE [dbo].[api_connectionrequest]  WITH CHECK ADD  CONSTRAINT [api_connectionrequest_address_id_f752ad91_fk_api_address_id] FOREIGN KEY([address_id])
REFERENCES [dbo].[api_address] ([id])
GO
ALTER TABLE [dbo].[api_connectionrequest] CHECK CONSTRAINT [api_connectionrequest_address_id_f752ad91_fk_api_address_id]
GO
ALTER TABLE [dbo].[api_connectionrequest]  WITH CHECK ADD  CONSTRAINT [api_connectionrequest_customer_id_81581390_fk_api_customer_id] FOREIGN KEY([customer_id])
REFERENCES [dbo].[api_customer] ([id])
GO
ALTER TABLE [dbo].[api_connectionrequest] CHECK CONSTRAINT [api_connectionrequest_customer_id_81581390_fk_api_customer_id]
GO
ALTER TABLE [dbo].[api_connectionrequest]  WITH CHECK ADD  CONSTRAINT [api_connectionrequest_status_id_8770662a_fk_api_status_id] FOREIGN KEY([status_id])
REFERENCES [dbo].[api_status] ([id])
GO
ALTER TABLE [dbo].[api_connectionrequest] CHECK CONSTRAINT [api_connectionrequest_status_id_8770662a_fk_api_status_id]
GO
ALTER TABLE [dbo].[api_connectionrequest]  WITH CHECK ADD  CONSTRAINT [api_connectionrequest_tariff_id_acfc26c7_fk_api_tariff_id] FOREIGN KEY([tariff_id])
REFERENCES [dbo].[api_tariff] ([id])
GO
ALTER TABLE [dbo].[api_connectionrequest] CHECK CONSTRAINT [api_connectionrequest_tariff_id_acfc26c7_fk_api_tariff_id]
GO
ALTER TABLE [dbo].[api_connectionrequestassignment]  WITH CHECK ADD FOREIGN KEY([employee_id])
REFERENCES [dbo].[api_employee] ([id])
GO
ALTER TABLE [dbo].[api_connectionrequestassignment]  WITH CHECK ADD FOREIGN KEY([connection_request_id])
REFERENCES [dbo].[api_connectionrequest] ([id])
GO
ALTER TABLE [dbo].[api_contract]  WITH CHECK ADD  CONSTRAINT [api_contract_address_id_1e457034_fk_api_address_id] FOREIGN KEY([address_id])
REFERENCES [dbo].[api_address] ([id])
GO
ALTER TABLE [dbo].[api_contract] CHECK CONSTRAINT [api_contract_address_id_1e457034_fk_api_address_id]
GO
ALTER TABLE [dbo].[api_contract]  WITH CHECK ADD  CONSTRAINT [api_contract_connection_request_id_f6f4c686_fk_api_connectionrequest_id] FOREIGN KEY([connection_request_id])
REFERENCES [dbo].[api_connectionrequest] ([id])
GO
ALTER TABLE [dbo].[api_contract] CHECK CONSTRAINT [api_contract_connection_request_id_f6f4c686_fk_api_connectionrequest_id]
GO
ALTER TABLE [dbo].[api_contract]  WITH CHECK ADD  CONSTRAINT [api_contract_customer_id_d6fb9327_fk_api_customer_id] FOREIGN KEY([customer_id])
REFERENCES [dbo].[api_customer] ([id])
GO
ALTER TABLE [dbo].[api_contract] CHECK CONSTRAINT [api_contract_customer_id_d6fb9327_fk_api_customer_id]
GO
ALTER TABLE [dbo].[api_contract]  WITH CHECK ADD  CONSTRAINT [api_contract_service_id_34e0a218_fk_api_service_id] FOREIGN KEY([service_id])
REFERENCES [dbo].[api_service] ([id])
GO
ALTER TABLE [dbo].[api_contract] CHECK CONSTRAINT [api_contract_service_id_34e0a218_fk_api_service_id]
GO
ALTER TABLE [dbo].[api_contract]  WITH CHECK ADD  CONSTRAINT [api_contract_tariff_id_5d13bf19_fk_api_tariff_id] FOREIGN KEY([tariff_id])
REFERENCES [dbo].[api_tariff] ([id])
GO
ALTER TABLE [dbo].[api_contract] CHECK CONSTRAINT [api_contract_tariff_id_5d13bf19_fk_api_tariff_id]
GO
ALTER TABLE [dbo].[api_contractequipment]  WITH CHECK ADD  CONSTRAINT [api_contractequipment_contract_id_09c1b7e6_fk_api_contract_id] FOREIGN KEY([contract_id])
REFERENCES [dbo].[api_contract] ([id])
GO
ALTER TABLE [dbo].[api_contractequipment] CHECK CONSTRAINT [api_contractequipment_contract_id_09c1b7e6_fk_api_contract_id]
GO
ALTER TABLE [dbo].[api_contractequipment]  WITH CHECK ADD  CONSTRAINT [api_contractequipment_equipment_id_2e6487fc_fk_api_equipment_id] FOREIGN KEY([equipment_id])
REFERENCES [dbo].[api_equipment] ([id])
GO
ALTER TABLE [dbo].[api_contractequipment] CHECK CONSTRAINT [api_contractequipment_equipment_id_2e6487fc_fk_api_equipment_id]
GO
ALTER TABLE [dbo].[api_customer]  WITH CHECK ADD  CONSTRAINT [api_customer_status_id_02990bff_fk_api_status_id] FOREIGN KEY([status_id])
REFERENCES [dbo].[api_status] ([id])
GO
ALTER TABLE [dbo].[api_customer] CHECK CONSTRAINT [api_customer_status_id_02990bff_fk_api_status_id]
GO
ALTER TABLE [dbo].[api_customer]  WITH CHECK ADD  CONSTRAINT [api_customer_user_id_905bea02_fk_api_user_id] FOREIGN KEY([user_id])
REFERENCES [dbo].[api_user] ([id])
GO
ALTER TABLE [dbo].[api_customer] CHECK CONSTRAINT [api_customer_user_id_905bea02_fk_api_user_id]
GO
ALTER TABLE [dbo].[api_employee]  WITH CHECK ADD  CONSTRAINT [api_employee_role_id_f7c7c850_fk_api_employeerole_id] FOREIGN KEY([role_id])
REFERENCES [dbo].[api_employeerole] ([id])
GO
ALTER TABLE [dbo].[api_employee] CHECK CONSTRAINT [api_employee_role_id_f7c7c850_fk_api_employeerole_id]
GO
ALTER TABLE [dbo].[api_employee]  WITH CHECK ADD  CONSTRAINT [api_employee_user_id_ed8ba4e1_fk_api_user_id] FOREIGN KEY([user_id])
REFERENCES [dbo].[api_user] ([id])
GO
ALTER TABLE [dbo].[api_employee] CHECK CONSTRAINT [api_employee_user_id_ed8ba4e1_fk_api_user_id]
GO
ALTER TABLE [dbo].[api_equipment]  WITH CHECK ADD  CONSTRAINT [api_equipment_category_id_12b9f04b_fk_api_equipmentcategory_id] FOREIGN KEY([category_id])
REFERENCES [dbo].[api_equipmentcategory] ([id])
GO
ALTER TABLE [dbo].[api_equipment] CHECK CONSTRAINT [api_equipment_category_id_12b9f04b_fk_api_equipmentcategory_id]
GO
ALTER TABLE [dbo].[api_invoice]  WITH CHECK ADD  CONSTRAINT [api_invoice_contract_id_2d64c4c5_fk_api_contract_id] FOREIGN KEY([contract_id])
REFERENCES [dbo].[api_contract] ([id])
GO
ALTER TABLE [dbo].[api_invoice] CHECK CONSTRAINT [api_invoice_contract_id_2d64c4c5_fk_api_contract_id]
GO
ALTER TABLE [dbo].[api_networkusage]  WITH CHECK ADD  CONSTRAINT [api_networkusage_contract_id_51ae100d_fk_api_contract_id] FOREIGN KEY([contract_id])
REFERENCES [dbo].[api_contract] ([id])
GO
ALTER TABLE [dbo].[api_networkusage] CHECK CONSTRAINT [api_networkusage_contract_id_51ae100d_fk_api_contract_id]
GO
ALTER TABLE [dbo].[api_payment]  WITH CHECK ADD  CONSTRAINT [api_payment_customer_id_477a0340_fk_api_customer_id] FOREIGN KEY([customer_id])
REFERENCES [dbo].[api_customer] ([id])
GO
ALTER TABLE [dbo].[api_payment] CHECK CONSTRAINT [api_payment_customer_id_477a0340_fk_api_customer_id]
GO
ALTER TABLE [dbo].[api_payment]  WITH CHECK ADD  CONSTRAINT [api_payment_method_id_2472ffba_fk_api_paymentmethod_id] FOREIGN KEY([method_id])
REFERENCES [dbo].[api_paymentmethod] ([id])
GO
ALTER TABLE [dbo].[api_payment] CHECK CONSTRAINT [api_payment_method_id_2472ffba_fk_api_paymentmethod_id]
GO
ALTER TABLE [dbo].[api_status]  WITH CHECK ADD  CONSTRAINT [api_status_context_id_9c96ff3c_fk_api_statuscontext_id] FOREIGN KEY([context_id])
REFERENCES [dbo].[api_statuscontext] ([id])
GO
ALTER TABLE [dbo].[api_status] CHECK CONSTRAINT [api_status_context_id_9c96ff3c_fk_api_statuscontext_id]
GO
ALTER TABLE [dbo].[api_supportticket]  WITH CHECK ADD  CONSTRAINT [api_supportticket_assigned_to_id_58ef3c94_fk_api_employee_id] FOREIGN KEY([assigned_to_id])
REFERENCES [dbo].[api_employee] ([id])
GO
ALTER TABLE [dbo].[api_supportticket] CHECK CONSTRAINT [api_supportticket_assigned_to_id_58ef3c94_fk_api_employee_id]
GO
ALTER TABLE [dbo].[api_supportticket]  WITH CHECK ADD  CONSTRAINT [api_supportticket_customer_id_9ada056a_fk_api_customer_id] FOREIGN KEY([customer_id])
REFERENCES [dbo].[api_customer] ([id])
GO
ALTER TABLE [dbo].[api_supportticket] CHECK CONSTRAINT [api_supportticket_customer_id_9ada056a_fk_api_customer_id]
GO
ALTER TABLE [dbo].[api_supportticket]  WITH CHECK ADD  CONSTRAINT [api_supportticket_status_id_1408f108_fk_api_status_id] FOREIGN KEY([status_id])
REFERENCES [dbo].[api_status] ([id])
GO
ALTER TABLE [dbo].[api_supportticket] CHECK CONSTRAINT [api_supportticket_status_id_1408f108_fk_api_status_id]
GO
ALTER TABLE [dbo].[api_tariffservice]  WITH CHECK ADD  CONSTRAINT [api_tariffservice_service_id_5af61b23_fk_api_service_id] FOREIGN KEY([service_id])
REFERENCES [dbo].[api_service] ([id])
GO
ALTER TABLE [dbo].[api_tariffservice] CHECK CONSTRAINT [api_tariffservice_service_id_5af61b23_fk_api_service_id]
GO
ALTER TABLE [dbo].[api_tariffservice]  WITH CHECK ADD  CONSTRAINT [api_tariffservice_tariff_id_5ef83521_fk_api_tariff_id] FOREIGN KEY([tariff_id])
REFERENCES [dbo].[api_tariff] ([id])
GO
ALTER TABLE [dbo].[api_tariffservice] CHECK CONSTRAINT [api_tariffservice_tariff_id_5ef83521_fk_api_tariff_id]
GO
ALTER TABLE [dbo].[api_user_groups]  WITH CHECK ADD  CONSTRAINT [api_user_groups_group_id_3af85785_fk_auth_group_id] FOREIGN KEY([group_id])
REFERENCES [dbo].[auth_group] ([id])
GO
ALTER TABLE [dbo].[api_user_groups] CHECK CONSTRAINT [api_user_groups_group_id_3af85785_fk_auth_group_id]
GO
ALTER TABLE [dbo].[api_user_groups]  WITH CHECK ADD  CONSTRAINT [api_user_groups_user_id_a5ff39fa_fk_api_user_id] FOREIGN KEY([user_id])
REFERENCES [dbo].[api_user] ([id])
GO
ALTER TABLE [dbo].[api_user_groups] CHECK CONSTRAINT [api_user_groups_user_id_a5ff39fa_fk_api_user_id]
GO
ALTER TABLE [dbo].[api_user_user_permissions]  WITH CHECK ADD  CONSTRAINT [api_user_user_permissions_permission_id_305b7fea_fk_auth_permission_id] FOREIGN KEY([permission_id])
REFERENCES [dbo].[auth_permission] ([id])
GO
ALTER TABLE [dbo].[api_user_user_permissions] CHECK CONSTRAINT [api_user_user_permissions_permission_id_305b7fea_fk_auth_permission_id]
GO
ALTER TABLE [dbo].[api_user_user_permissions]  WITH CHECK ADD  CONSTRAINT [api_user_user_permissions_user_id_f3945d65_fk_api_user_id] FOREIGN KEY([user_id])
REFERENCES [dbo].[api_user] ([id])
GO
ALTER TABLE [dbo].[api_user_user_permissions] CHECK CONSTRAINT [api_user_user_permissions_user_id_f3945d65_fk_api_user_id]
GO
ALTER TABLE [dbo].[auth_group_permissions]  WITH CHECK ADD  CONSTRAINT [auth_group_permissions_group_id_b120cbf9_fk_auth_group_id] FOREIGN KEY([group_id])
REFERENCES [dbo].[auth_group] ([id])
GO
ALTER TABLE [dbo].[auth_group_permissions] CHECK CONSTRAINT [auth_group_permissions_group_id_b120cbf9_fk_auth_group_id]
GO
ALTER TABLE [dbo].[auth_group_permissions]  WITH CHECK ADD  CONSTRAINT [auth_group_permissions_permission_id_84c5c92e_fk_auth_permission_id] FOREIGN KEY([permission_id])
REFERENCES [dbo].[auth_permission] ([id])
GO
ALTER TABLE [dbo].[auth_group_permissions] CHECK CONSTRAINT [auth_group_permissions_permission_id_84c5c92e_fk_auth_permission_id]
GO
ALTER TABLE [dbo].[auth_permission]  WITH CHECK ADD  CONSTRAINT [auth_permission_content_type_id_2f476e4b_fk_django_content_type_id] FOREIGN KEY([content_type_id])
REFERENCES [dbo].[django_content_type] ([id])
GO
ALTER TABLE [dbo].[auth_permission] CHECK CONSTRAINT [auth_permission_content_type_id_2f476e4b_fk_django_content_type_id]
GO
ALTER TABLE [dbo].[django_admin_log]  WITH CHECK ADD  CONSTRAINT [django_admin_log_content_type_id_c4bce8eb_fk_django_content_type_id] FOREIGN KEY([content_type_id])
REFERENCES [dbo].[django_content_type] ([id])
GO
ALTER TABLE [dbo].[django_admin_log] CHECK CONSTRAINT [django_admin_log_content_type_id_c4bce8eb_fk_django_content_type_id]
GO
ALTER TABLE [dbo].[django_admin_log]  WITH CHECK ADD  CONSTRAINT [django_admin_log_user_id_c564eba6_fk_api_user_id] FOREIGN KEY([user_id])
REFERENCES [dbo].[api_user] ([id])
GO
ALTER TABLE [dbo].[django_admin_log] CHECK CONSTRAINT [django_admin_log_user_id_c564eba6_fk_api_user_id]
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask]  WITH CHECK ADD  CONSTRAINT [django_celery_beat_periodictask_clocked_id_47a69f82_fk_django_celery_beat_clockedschedule_id] FOREIGN KEY([clocked_id])
REFERENCES [dbo].[django_celery_beat_clockedschedule] ([id])
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask] CHECK CONSTRAINT [django_celery_beat_periodictask_clocked_id_47a69f82_fk_django_celery_beat_clockedschedule_id]
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask]  WITH CHECK ADD  CONSTRAINT [django_celery_beat_periodictask_crontab_id_d3cba168_fk_django_celery_beat_crontabschedule_id] FOREIGN KEY([crontab_id])
REFERENCES [dbo].[django_celery_beat_crontabschedule] ([id])
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask] CHECK CONSTRAINT [django_celery_beat_periodictask_crontab_id_d3cba168_fk_django_celery_beat_crontabschedule_id]
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask]  WITH CHECK ADD  CONSTRAINT [django_celery_beat_periodictask_interval_id_a8ca27da_fk_django_celery_beat_intervalschedule_id] FOREIGN KEY([interval_id])
REFERENCES [dbo].[django_celery_beat_intervalschedule] ([id])
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask] CHECK CONSTRAINT [django_celery_beat_periodictask_interval_id_a8ca27da_fk_django_celery_beat_intervalschedule_id]
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask]  WITH CHECK ADD  CONSTRAINT [django_celery_beat_periodictask_solar_id_a87ce72c_fk_django_celery_beat_solarschedule_id] FOREIGN KEY([solar_id])
REFERENCES [dbo].[django_celery_beat_solarschedule] ([id])
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask] CHECK CONSTRAINT [django_celery_beat_periodictask_solar_id_a87ce72c_fk_django_celery_beat_solarschedule_id]
GO
ALTER TABLE [dbo].[api_connectionrequestassignment]  WITH CHECK ADD  CONSTRAINT [CK_ConnectionRequestAssignment_Role] CHECK  (([role]='manager' OR [role]='technician'))
GO
ALTER TABLE [dbo].[api_connectionrequestassignment] CHECK CONSTRAINT [CK_ConnectionRequestAssignment_Role]
GO
ALTER TABLE [dbo].[api_equipment]  WITH CHECK ADD  CONSTRAINT [api_equipment_stock_quantity_5e36b539_check] CHECK  (([stock_quantity]>=(0)))
GO
ALTER TABLE [dbo].[api_equipment] CHECK CONSTRAINT [api_equipment_stock_quantity_5e36b539_check]
GO
ALTER TABLE [dbo].[django_admin_log]  WITH CHECK ADD  CONSTRAINT [django_admin_log_action_flag_a8637d59_check] CHECK  (([action_flag]>=(0)))
GO
ALTER TABLE [dbo].[django_admin_log] CHECK CONSTRAINT [django_admin_log_action_flag_a8637d59_check]
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask]  WITH CHECK ADD CHECK  (([expire_seconds]>=(0)))
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask]  WITH CHECK ADD CHECK  (([priority]>=(0)))
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask]  WITH CHECK ADD  CONSTRAINT [django_celery_beat_periodictask_total_run_count_cf45f5ae_check] CHECK  (([total_run_count]>=(0)))
GO
ALTER TABLE [dbo].[django_celery_beat_periodictask] CHECK CONSTRAINT [django_celery_beat_periodictask_total_run_count_cf45f5ae_check]
GO
/****** Object:  StoredProcedure [dbo].[ApproveConnectionRequestsWithContracts]    Script Date: 4/26/2025 2:55:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ApproveConnectionRequestsWithContracts]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ConnectionRequestContextId INT;
    DECLARE @ApprovedStatusId INT;

    -- Get the context ID for ConnectionRequest
    SELECT @ConnectionRequestContextId = id
    FROM api_statuscontext
    WHERE context = 'ConnectionRequest';

    -- Get the Approved status ID for this context
    SELECT @ApprovedStatusId = id
    FROM api_status
    WHERE status = 'Approved' AND context_id = @ConnectionRequestContextId;

    -- Safety check
    IF @ApprovedStatusId IS NULL
    BEGIN
        RAISERROR('Approved status not found for ConnectionRequest context.', 16, 1);
        RETURN;
    END

    -- Update all connection requests that:
    --  - Have a linked contract
    --  - Are not already approved
    UPDATE cr
    SET cr.status_id = @ApprovedStatusId
    FROM api_connectionrequest cr
    INNER JOIN api_contract c ON c.connection_request_id = cr.id
    WHERE cr.status_id <> @ApprovedStatusId;

    SELECT 'All eligible connection requests have been updated to Approved.' AS Result;
END;
GO
/****** Object:  StoredProcedure [dbo].[CalculateNetworkUsageStatistics]    Script Date: 4/26/2025 2:55:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CalculateNetworkUsageStatistics]
    @StartDate DATE,
    @EndDate DATE,
    @GenerateReport BIT = 1,
    @ApplyBandwidthCharges BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate dates
    IF @StartDate > @EndDate
    BEGIN
        RAISERROR('Start date must be before or equal to end date', 16, 1);
        RETURN;
    END
    
    -- Create temp table for usage statistics
    CREATE TABLE #UsageStats (
        ContractId INT,
        CustomerId INT,
        CustomerName NVARCHAR(100),
        ServiceName NVARCHAR(100),
        TariffName NVARCHAR(100),
        TotalDownloadGB DECIMAL(12, 2),
        TotalUploadGB DECIMAL(12, 2),
        TotalUsageGB DECIMAL(12, 2),
        DailyAvgDownloadGB DECIMAL(12, 2),
        DailyAvgUploadGB DECIMAL(12, 2),
        DaysInPeriod INT,
        ExcessUsageGB DECIMAL(12, 2),
        ExcessChargeAmount DECIMAL(10, 2)
    );
    
    -- Calculate usage during the period
    INSERT INTO #UsageStats (
        ContractId, CustomerId, CustomerName, ServiceName, TariffName,
        TotalDownloadGB, TotalUploadGB, TotalUsageGB, DailyAvgDownloadGB, 
        DailyAvgUploadGB, DaysInPeriod, ExcessUsageGB, ExcessChargeAmount
    )
    SELECT 
        c.id AS ContractId,
        c.customer_id AS CustomerId,
        u.first_name + ' ' + u.last_name AS CustomerName,
        s.name AS ServiceName,
        t.name AS TariffName,
        SUM(nu.download_gb) AS TotalDownloadGB,
        SUM(nu.upload_gb) AS TotalUploadGB,
        SUM(nu.download_gb + nu.upload_gb) AS TotalUsageGB,
        SUM(nu.download_gb) / DATEDIFF(DAY, @StartDate, @EndDate) AS DailyAvgDownloadGB,
        SUM(nu.upload_gb) / DATEDIFF(DAY, @StartDate, @EndDate) AS DailyAvgUploadGB,
        DATEDIFF(DAY, @StartDate, @EndDate) AS DaysInPeriod,
        CASE 
            -- Example: charge if total usage exceeds 500GB
            WHEN SUM(nu.download_gb + nu.upload_gb) > 500 THEN SUM(nu.download_gb + nu.upload_gb) - 500
            ELSE 0
        END AS ExcessUsageGB,
        CASE 
            -- Example: $2 per GB over the limit
            WHEN SUM(nu.download_gb + nu.upload_gb) > 500 THEN (SUM(nu.download_gb + nu.upload_gb) - 500) * 2.00
            ELSE 0
        END AS ExcessChargeAmount
    FROM api_networkusage nu
    INNER JOIN api_contract c ON nu.contract_id = c.id
    INNER JOIN api_customer cust ON c.customer_id = cust.id
    INNER JOIN api_user u ON cust.user_id = u.id
    INNER JOIN api_service s ON c.service_id = s.id
    INNER JOIN api_tariff t ON c.tariff_id = t.id
    WHERE nu.date BETWEEN @StartDate AND @EndDate
    AND (c.end_date IS NULL OR c.end_date > @StartDate)
    GROUP BY 
        c.id, c.customer_id, u.first_name, u.last_name, s.name, t.name;
    
    -- Option to apply bandwidth charges
    IF @ApplyBandwidthCharges = 1
    BEGIN
        -- Create additional invoices for customers who exceeded usage limits
        INSERT INTO api_invoice (
            contract_id, amount, issue_date, due_date, description, status
        )
        SELECT 
            us.ContractId,
            us.ExcessChargeAmount,
            GETDATE(),
            DATEADD(DAY, 14, GETDATE()), -- Due in 14 days
            'Excess bandwidth usage charge: ' + 
            CAST(us.ExcessUsageGB AS NVARCHAR(10)) + 
            'GB over 500GB limit for period ' + 
            CONVERT(NVARCHAR(10), @StartDate, 120) + ' to ' + 
            CONVERT(NVARCHAR(10), @EndDate, 120),
            'pending'
        FROM #UsageStats us
        WHERE us.ExcessChargeAmount > 0;
        
        -- Update balances for customers who were charged
        UPDATE api_customer
        SET balance = balance - us.ExcessChargeAmount
        FROM api_customer c
        INNER JOIN #UsageStats us ON c.id = us.CustomerId
        WHERE us.ExcessChargeAmount > 0;
    END
    
    -- Generate the report if requested
    IF @GenerateReport = 1
    BEGIN
        -- Summary by customer
        SELECT 
            CustomerId,
            CustomerName,
            COUNT(DISTINCT ContractId) AS NumberOfContracts,
            SUM(TotalDownloadGB) AS TotalDownloadGB,
            SUM(TotalUploadGB) AS TotalUploadGB,
            SUM(TotalUsageGB) AS TotalUsageGB,
            SUM(ExcessUsageGB) AS TotalExcessUsageGB,
            SUM(ExcessChargeAmount) AS TotalExcessCharges
        FROM #UsageStats
        GROUP BY CustomerId, CustomerName
        ORDER BY TotalUsageGB DESC;
        
        -- Detail by contract
        SELECT 
            ContractId,
            CustomerName,
            ServiceName,
            TariffName,
            TotalDownloadGB,
            TotalUploadGB,
            TotalUsageGB,
            DailyAvgDownloadGB,
            DailyAvgUploadGB,
            ExcessUsageGB,
            ExcessChargeAmount
        FROM #UsageStats
        ORDER BY TotalUsageGB DESC;
        
        -- Usage statistics
        SELECT
            AVG(TotalUsageGB) AS AverageUsagePerContract,
            MAX(TotalUsageGB) AS MaxUsagePerContract,
            MIN(TotalUsageGB) AS MinUsagePerContract,
            COUNT(CASE WHEN ExcessUsageGB > 0 THEN 1 END) AS ContractsExceedingLimit,
            COUNT(*) AS TotalContracts,
            SUM(ExcessChargeAmount) AS TotalExcessCharges
        FROM #UsageStats;
    END
    
    -- Clean up
    DROP TABLE #UsageStats;
END;
GO
/****** Object:  StoredProcedure [dbo].[ManageConnectionRequestStatus]    Script Date: 4/26/2025 2:55:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROCEDURE [dbo].[ManageConnectionRequestStatus]
    @ConnectionRequestId INT,
    @NewStatusName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ApprovedStatusId INT;
    DECLARE @CurrentStatusId INT;
    DECLARE @HasContract BIT = 0;
    DECLARE @ConnectionRequestContextId INT;
    
    SELECT @ConnectionRequestContextId = id 
    FROM  api_statuscontext
    WHERE context = 'ConnectionRequest';
    
    SELECT @ApprovedStatusId = id 
    FROM api_status 
    WHERE status = 'Approved' AND context_id = @ConnectionRequestContextId;
    
    IF EXISTS (SELECT 1 FROM api_contract WHERE connection_request_id = @ConnectionRequestId)
    BEGIN
        SET @HasContract = 1;
    END
    
    SELECT @CurrentStatusId = status_id 
    FROM api_connectionrequest 
    WHERE id = @ConnectionRequestId;
    
    IF @CurrentStatusId = @ApprovedStatusId
    BEGIN
        IF @NewStatusName <> 'Approved'
        BEGIN
            RAISERROR('Cant change the status he request is approved', 16, 1);
            RETURN;
        END
    END
    
    IF @HasContract = 1
    BEGIN
        UPDATE api_connectionrequest
        SET status_id = @ApprovedStatusId
        WHERE id = @ConnectionRequestId;
        
        IF @NewStatusName <> 'Approved'
        BEGIN
            RAISERROR('Status "Approved" is set, because there is a contract for a request', 16, 1);
            RETURN;
        END
    END
    ELSE
    BEGIN
        DECLARE @NewStatusId INT;
        
        SELECT @NewStatusId = id 
        FROM api_status 
        WHERE status = @NewStatusName AND context_id = @ConnectionRequestContextId;
        
        IF @NewStatusId IS NULL
        BEGIN
            RAISERROR('This status does not exist for ConnectionRequest context', 16, 1);
            RETURN;
        END
        
        UPDATE api_connectionrequest
        SET status_id = @NewStatusId
        WHERE id = @ConnectionRequestId;
    END
    
    SELECT 'Status is successfuly set!' AS Result;
END;
GO
/****** Object:  StoredProcedure [dbo].[UpdateCustomerStatusBasedOnContracts]    Script Date: 4/26/2025 2:55:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[UpdateCustomerStatusBasedOnContracts]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActiveStatusId INT;
    DECLARE @InactiveStatusId INT;
    DECLARE @CustomerContextId INT;

    -- Get the Customer context ID
    SELECT @CustomerContextId = Id
    FROM api_statuscontext
    WHERE context = 'Customer';

    -- Get Active and Inactive status IDs for Customer context
    SELECT @ActiveStatusId = Id
    FROM api_status
    WHERE status = 'Active' AND context_id = @CustomerContextId;

    SELECT @InactiveStatusId = Id
    FROM api_status
    WHERE status = 'Inactive' AND context_id = @CustomerContextId;

    -- Create temporary table to store customers and their contract status
    CREATE TABLE #CustomersWithContractStatus (
        CustomerId INT,
        HasActiveContract BIT
    );

    -- Find all customers and whether they have active contracts
    INSERT INTO #CustomersWithContractStatus (CustomerId, HasActiveContract)
    SELECT 
        c.id AS CustomerId,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM api_contract ct
                WHERE ct.customer_id = c.id
                AND (ct.end_date IS NULL OR ct.end_date > GETDATE())
            ) THEN 1
            ELSE 0
        END AS HasActiveContract
    FROM api_customer c;

    -- Update customers with active contracts to Active status
    UPDATE api_customer
    SET status_id = @ActiveStatusId
    FROM api_customer c
    JOIN #CustomersWithContractStatus cwcs ON c.id = cwcs.CustomerId
    WHERE cwcs.HasActiveContract = 1
    AND c.status_id != @ActiveStatusId;

    -- Update customers without active contracts to Inactive status, only if they were Active
    UPDATE api_customer
    SET status_id = @InactiveStatusId
    FROM api_customer c
    JOIN #CustomersWithContractStatus cwcs ON c.id = cwcs.CustomerId
    WHERE cwcs.HasActiveContract = 0
    AND c.status_id = @ActiveStatusId;  -- Only update if the current status is Active

    -- Clean up
    DROP TABLE #CustomersWithContractStatus;

    -- Output summary of changes
    SELECT 
        COUNT(CASE WHEN c.status_id = @ActiveStatusId THEN 1 END) AS ActiveCustomers,
        COUNT(CASE WHEN c.status_id = @InactiveStatusId THEN 1 END) AS InactiveCustomers
    FROM api_customer c;
END;
GO
USE [master]
GO
ALTER DATABASE [isp] SET  READ_WRITE 
GO
