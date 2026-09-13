# Request & Data Flow Specifications

## 1. Authentication & Session Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Frontend (SPA)
    participant SupaAuth as Supabase Auth Service
    participant Backend as Flask API Backend

    User->>Frontend: Submit Email & Password (Login)
    Frontend->>SupaAuth: signInWithPassword(email, password)
    SupaAuth-->>Frontend: Session JWT + User Object
    Frontend->>Frontend: Store session in SessionContextProvider
    Frontend->>Backend: HTTP POST to Protected Route with Bearer JWT
    Backend->>Backend: Parse "Authorization: Bearer <token>"
    Backend->>SupaAuth: auth.get_user(jwt)
    alt Valid Token
        SupaAuth-->>Backend: User Identity Object
        Backend->>Backend: Attach user to Flask g.user
        Backend->>Backend: Execute Route Handler
        Backend-->>Frontend: HTTP 200 OK + JSON Payload
    else Missing / Invalid / Expired Token
        SupaAuth-->>Backend: Authentication Error
        Backend-->>Frontend: HTTP 401 Unauthorized ("Invalid or expired token")
    end
```

## 2. Disease Detection Scan Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as ScanPage.jsx
    participant API as src/api/disease.js
    participant Route as /predict_disease
    participant Svc as DiseaseService (TFLite)

    User->>UI: Select/Drop Leaf Image
    UI->>UI: Local Validation (MIME is image/*, Size <= 10MB)
    UI->>UI: Generate Object URL for preview
    User->>UI: Click "Scan Crop"
    UI->>API: predictDisease(formData)
    API->>Route: POST /predict_disease (multipart/form-data)
    Route->>Route: Verify Token (@token_required)
    Route->>Route: Rate Limit Check (Flask-Limiter)
    Route->>Route: In-memory image header integrity check (PIL)
    Route->>Svc: predict(image_bytes)
    Svc->>Svc: Convert to RGB, Resize (300, 300)
    Svc->>Svc: Normalize float (/ 255.0)
    Svc->>Svc: TFLite interpreter.invoke()
    Svc->>Svc: Argmax class & calculate confidence
    Svc-->>Route: { predicted_disease, confidence }
    Route-->>API: HTTP 200 OK JSON
    API-->>UI: Result Object
    UI->>UI: Render Disease Name & Confidence Indicator
```

## 3. Crop & Fertilizer Recommendation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Form as CropRecPage / FertilizerRecPage
    participant API as src/api/(crop|fertilizer).js
    participant Route as /(recommend_crop|recommend_fertilizer)
    participant Svc as CropService / FertilizerService

    User->>Form: Enter Soil/Climate Inputs
    Form->>Form: Validate non-empty & valid numbers
    Form->>API: recommendCrop(payload) / recommendFertilizer(payload)
    API->>Route: POST JSON (Bearer Token)
    Route->>Route: Verify Token & Rate Limits
    Route->>Route: Validate Numeric Ranges & Categorical Options
    Route->>Svc: recommend(data)
    Note over Svc: Identical feature ordering & scaling preserved
    Svc->>Svc: model.predict(transformed_features)
    Svc->>Svc: Inverse transform categorical label
    Svc-->>Route: Recommendation Result
    Route-->>API: HTTP 200 OK
    API-->>Form: Update UI with Recommended Crop / Fertilizer
```

## 4. Real-time Weather Flow with Timezone Correction

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as WeatherContext.jsx / WeatherPage.jsx
    participant API as src/api/weather.js
    participant Route as /get_weather
    participant OWM as OpenWeatherMap API

    User->>UI: Search City or GPS Lat/Lon
    UI->>API: fetchWeather({ city | lat, lon })
    API->>Route: POST /get_weather (Bearer Token)
    Route->>Route: Validate coordinates (-90..90, -180..180) or city string
    Route->>OWM: GET /data/2.5/weather?units=metric (10s timeout)
    OWM-->>Route: Weather JSON (includes timezone shift in seconds)
    Route->>Route: Calculate sunrise/sunset in local timezone (UTC + timezone offset)
    Route-->>API: Normalized Weather JSON
    API-->>UI: Render Temperature, Condition, Local Sunrise/Sunset
```

## 5. Mandi Market Prices Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as MandiPage.jsx / MandiProvider.jsx
    participant API as src/api/mandi.js
    participant Route as /get_mandi_prices
    participant Cache as In-Memory Cache (15 min TTL)
    participant Gov as data.gov.in API

    UI->>UI: Guard check: user must be authenticated
    UI->>API: fetchMandiPrices({ state, commodity, district? })
    API->>Route: POST /get_mandi_prices
    Route->>Route: Validate state & commodity
    Route->>Cache: Lookup key (state:commodity:district)
    alt Cache Hit
        Cache-->>Route: Cached Records
    else Cache Miss
        Route->>Gov: GET data.gov.in (15s timeout)
        Gov-->>Route: Mandi Records JSON
        Route->>Cache: Store Records with 15m TTL
    end
    Route-->>API: Filtered & Normalized Array of Records
    API-->>UI: Display Market Prices Table
```
