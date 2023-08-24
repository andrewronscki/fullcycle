"use client";

import { useEffect, useRef } from "react";

import { useMap } from "../hooks/useMap";
import { socket } from "../utils/socket-io";
import { Route } from "../utils/model";

export default function Admin() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapContainerRef);

	useEffect(() => {
		socket.connect()
		
		socket.on('admin-new-points', async (data: { route_id: string; lat: number; lng: number; }) => {
			if (!map?.hasRoute(data.route_id)) {		
				const response = await fetch(`http://localhost:3333/routes/${data.route_id}`);
				const route: Route = await response.json();

				map?.removeAllRoutes()
				await map?.addRouteWithIcons({
					routeId: data.route_id,
					startMarkerOptions: {
						position: route.directions.routes[0].legs[0].start_location
					},
					endMarkerOptions: {
						position: route.directions.routes[0].legs[0].end_location
					},
					carMarkerOptions: {
						position: route.directions.routes[0].legs[0].start_location
					}
				})

			}

			map?.moveCar(data.route_id, { lat: data.lat, lng: data.lng });
		});

		return () => {
			socket.disconnect();
		}
	}, []);


  

  return (
    <div className="flex flex-row">
      <div
        className="flex min-h-screen w-full"
        id="map"
        ref={mapContainerRef}
      />
    </div>
  );
}
