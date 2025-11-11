
'use client'

import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { ReactNode, useEffect, useRef } from "react";

// Define the component props
interface GoogleMapsProps {
    lat: number;
    lng: number;
    zoom?: number;
    markerText?: string;
}

// The final, clean, and working Map Component
const MapComponent = ({ lat, lng, zoom, mapId, markerText }) => {
    const mapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // 1. Create the Map
        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom,
            mapId,
            disableDefaultUI: true,
        });

        // 2. Create a custom HTML element for the marker
        const pinElement = document.createElement('div');
        pinElement.style.width = '24px';
        pinElement.style.height = '24px';
        pinElement.style.borderRadius = '50%';
        pinElement.style.backgroundColor = '#FF0000'; // Red
        pinElement.style.border = '2px solid white';
        pinElement.style.cursor = 'pointer';
        pinElement.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';

        // 3. Create the Advanced Marker with the custom element
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            content: pinElement,
        });

        // 4. Create the InfoWindow (it can be created empty)
        const infoWindow = new window.google.maps.InfoWindow({
            disableAutoPan: true,
        });

        // 5. Define event handlers
        const handleMouseOver = () => {
            // Set the content dynamically on hover
            infoWindow.setContent(`<div style="color: #000; padding: 2px 5px; font-weight: 600;">${markerText}</div>`);
            infoWindow.open({ anchor: marker, map });
        };

        const handleMouseOut = () => {
            infoWindow.close();
        };

        // 6. Add event listeners to the custom HTML element
        pinElement.addEventListener('mouseover', handleMouseOver);
        pinElement.addEventListener('mouseout', handleMouseOut);

        // 7. Cleanup function to remove listeners and marker on unmount
        return () => {
            pinElement.removeEventListener('mouseover', handleMouseOver);
            pinElement.removeEventListener('mouseout', handleMouseOut);
            marker.map = null;
        };
    }, [lat, lng, zoom, mapId, markerText]); // Effect dependencies

    return <div ref={mapRef} className="h-full w-full" />;
}

// Main component that handles API loading
export default function GoogleMaps({ lat, lng, zoom = 17, markerText = "Наш офис" }: GoogleMapsProps) {
    const MAP_ID = 'REMONT_PRINTERA';

    const render = (status: Status): ReactNode => {
        switch (status) {
            case Status.LOADING:
                return <p>Загрузка карты...</p>;
            case Status.FAILURE:
                return <p>Ошибка загрузки карты.</p>;
            case Status.SUCCESS:
                return (
                   <MapComponent 
                        lat={lat}
                        lng={lng}
                        zoom={zoom}
                        mapId={MAP_ID}
                        markerText={markerText}
                   />
                );
        }
    };

    return (
        <Wrapper 
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            render={render}
            libraries={["marker"]}
        />
    );
}
