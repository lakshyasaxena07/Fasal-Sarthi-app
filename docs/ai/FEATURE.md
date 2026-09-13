# Feature Inventory & Roadmap Demarcation

## 1. Implemented & Supported Features

| Feature Area | Endpoint / Route | Technology / Model | Status |
| :--- | :--- | :--- | :--- |
| **Crop Disease Detection** | `POST /predict_disease` <br> UI: `/scan` | TensorFlow Lite (`FasalSarthi_Full_Model.tflite`, 19 classes) | Active |
| **Disease Treatment Advice** | `POST /sarthi_ai_chat` <br> UI: `/scan` (Advice Button) | Google Gemini 2.5 Flash REST API | Active |
| **Crop Recommendation** | `POST /recommend_crop` <br> UI: `/crop-recommendation` | Scikit-learn Stacking Classifier (`best_stacking_model_final.joblib`) | Active |
| **Crop Cultivation Advice** | `POST /sarthi_ai_chat` <br> UI: `/crop-recommendation` | Google Gemini 2.5 Flash REST API | Active |
| **Fertilizer Recommendation** | `POST /recommend_fertilizer` <br> UI: `/fertilizer-advice` | Random Forest Classifier (`random_forest_model.joblib`) | Active |
| **Real-time Weather & Alerts** | `POST /get_weather` <br> UI: `/weather`, `/dashboard` | OpenWeatherMap API | Active |
| **Mandi Market Prices** | `POST /get_mandi_prices` <br> UI: `/mandi-prices`, `/dashboard` | data.gov.in Government API | Active |
| **Sarthi AI Agricultural Chatbot**| `POST /sarthi_ai_chat` <br> UI: `/chat` | Google Gemini 2.5 Flash (Hindi/English bilingual) | Active |
| **User Authentication** | Supabase Auth <br> UI: `/login`, `/register` | Supabase GoTrue JWT Bearer Tokens | Active |
| **Farmer Profile Management** | Supabase PostgreSQL `profiles` table <br> UI: `/create-profile`, `/edit-profile` | Supabase PostgREST | Active |

---

## 2. Documented Future Scope (Explicitly NOT Implemented in this Scope)

Per hard project constraints, **no new product features** are to be added in this hardening cycle. The following are formally categorized as future enhancements:

1. **"My Crops" / "Mera Khet" Farm Field Management**:
   - *Current State*: Concept page (`MyCropsPage.jsx`) with dummy static cards. Not wired to any backend database table.
   - *Future Scope*: Requires designing a normalized database schema (`farms`, `fields`, `crop_plantings`, `activities`), Supabase migrations, RLS policies, and CRUD API endpoints.
   - *Hardening Action*: Clearly demarcate as "Prototype / Roadmap Concept". Do not fabricate fake database stubs.

2. **Automated Offline PWA & Service Workers**:
   - Offline caching of disease detection instructions, crop catalogs, and mandi guides.

3. **Hourly / Multi-Day Weather Forecasts**:
   - Upgrading from OWM standard weather to 5-day / 3-hour or One Call API forecasts.

4. **Multi-Model TFLite Concurrency Enhancement**:
   - Upgrading model deployment to dedicated inference workers or an inference microservice to support high-concurrency requests safely.
