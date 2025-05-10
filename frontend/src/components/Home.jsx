import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  AppBar,
  Tabs,
  Tab,
  Toolbar,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  CardActions,
  Grid,
  Box,
  useTheme,
  useMediaQuery,
  Fade,
  Chip,
  Paper,
  Divider,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import WifiIcon from "@mui/icons-material/Wifi";
import TvIcon from "@mui/icons-material/Tv";
import PhoneIcon from "@mui/icons-material/Phone";
import SpeedIcon from "@mui/icons-material/Speed";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import InfoIcon from "@mui/icons-material/Info";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// Styled components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiTab-root": {
    fontWeight: 600,
    fontSize: "1rem",
    transition: "all 0.3s",
    "&:hover": {
      color: theme.palette.primary.main,
      opacity: 1,
    },
  },
  "& .Mui-selected": {
    color: theme.palette.primary.main,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s, box-shadow 0.3s",
  borderRadius: theme.spacing(2),
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: theme.shadows[8],
  },
}));

const TariffHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2, 1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const TariffContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const TariffActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  justifyContent: "flex-end",
}));

const HeroSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 2),
  textAlign: "center",
  background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.common.white,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(4),
}));

const ServiceIcon = ({ type }) => {
  switch (type?.toLowerCase()) {
    case "internet":
      return <WifiIcon />;
    case "iptv":
      return <TvIcon />;
    case "phone":
      return <PhoneIcon />;
    default:
      return <WifiIcon />;
  }
};

export default function Homelanding() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [tariffs, setTariffs] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/services/");
        setServices(response.data);
        if (response.data.length > 0) {
          setSelectedService(response.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      }
    };
    fetchServices();
  }, []);

  // Fetch tariffs when a service is selected
  useEffect(() => {
    if (selectedService) {
      const fetchTariffs = async () => {
        try {
          const response = await api.get(
            `/tariffs/by_service/?service_id=${selectedService}`

          );
          // Filter only active tariffs
          const activeTariffs = response.data.filter(
            (tariff) => tariff.is_active
          );
          setTariffs(activeTariffs);
        } catch (err) {
          console.error("Failed to load tariffs:", err);
        }
      };
      fetchTariffs();
    }
  }, [selectedService]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedService(services[newValue]?.id);
  };

  const currentService = services.find((s) => s.id === selectedService);

  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography
            variant="h5"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SuperConnect ISP
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {isAuthenticated ? "Dashboard" : "Login"}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Fade in timeout={1000}>
          <HeroSection>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Find Your Perfect Connection
            </Typography>
            <Typography
              variant="h6"
              sx={{ maxWidth: 700, mx: "auto", mb: 4, opacity: 0.9 }}
            >
              High-speed internet, TV packages, and phone services tailored to
              your needs
            </Typography>
          </HeroSection>
        </Fade>

        <Paper
          elevation={1}
          sx={{ borderRadius: 2, mb: 4, overflow: "hidden" }}
        >
          <StyledTabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            indicatorColor="primary"
          >
            {services.map((service) => (
              <Tab
                key={service.id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ServiceIcon type={service.type || service.name} />
                    <span>{service.name}</span>
                  </Box>
                }
              />
            ))}
          </StyledTabs>
        </Paper>

        {currentService && (
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
            {currentService.name} Plans
          </Typography>
        )}

        <Grid container spacing={3}>
          {tariffs.length > 0 ? (
            tariffs.map((tariff, index) => (
              <Grid item xs={12} sm={6} md={4} key={tariff.id}>
                <Fade in timeout={500 + index * 200}>
                  <StyledCard elevation={3}>
                    <TariffHeader>
                      <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                        {tariff.name}
                      </Typography>
                    </TariffHeader>
                    <TariffContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <LocalOfferIcon color="primary" />
                        <Typography
                          variant="h6"
                          color="primary.main"
                          sx={{ fontWeight: "bold" }}
                        >
                          ${tariff.price}/mo
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {tariff.speed && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <SpeedIcon fontSize="small" />
                          <Typography variant="body1">
                            Speed: <b>{tariff.speed} Mbps</b>
                          </Typography>
                        </Box>
                      )}

                      {tariff.channels && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <TvIcon fontSize="small" />
                          <Typography variant="body1">
                            <b>{tariff.channels}</b> channels
                          </Typography>
                        </Box>
                      )}

                      {tariff.description && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                            mt: 2,
                          }}
                        >
                          <InfoIcon fontSize="small" sx={{ mt: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {tariff.description}
                          </Typography>
                        </Box>
                      )}
                    </TariffContent>

                    <TariffActions>
                      <Button
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          px: 3,
                        }}
                      >
                        Select Plan
                      </Button>
                    </TariffActions>
                  </StyledCard>
                </Fade>
              </Grid>
            ))
          ) : (
            <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No active plans available for this service.
              </Typography>
            </Box>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
