import { Curve, Vector2, Vector3 } from 'three';

/**
 * A 3D curve that is defined by a 2D curve.
 *
 * ```js
 * const baseCurve = new THREE.EllipseCurve( 0, 0, 10, 5, 0, Math.PI * 2, false, 0 );
 * const curve = new THREE.PlanarCurve3( baseCurve );
 *
 * const points = curve.getPoints( 50 );
 * const geometry = new THREE.BufferGeometry().setFromPoints( points );
 *
 * const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
 *
 * // Create the final object to add to the scene
 * const object = new THREE.Line( geometry, material );
 * ```
 *
 * @augments Curve
 */
class PlanarCurve3 extends Curve {

	/**
	 * Constructs a 3D curve from a 2D curve.
	 * 
	 * TODO: Add a parameter to specify the plane.
	 *
	 * @param {Curve<Vector2>} curve2d - A 2D curve.
	 */
	constructor(curve2d) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPlanarCurve3 = true;

		this.type = 'PlanarCurve3';

		/**
		 * The 2D curve.
		 *
		 * @type {Curve<Vector2>}
		 * @default 
		 */
		this.curve2d = curve2d;

	}

	/**
	 * Returns a point on the curve.
	 *
	 * @param {number} t - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
	 * @param {Vector2} [optionalTarget] - The optional target vector the result is written to.
	 * @return {Vector2} The position on the curve.
	 */
	getPoint(t, optionalTarget = new Vector3()) {

		const point = optionalTarget;

		const v2 = this.curve2d.getPoint(t);

		return point.set(v2.x, v2.y, 0);

	}

	copy(source) {

		super.copy(source);

		this.curve2d = source.curve2d;

		return this;

	}

	toJSON() {

		const data = super.toJSON();

		data.curve2d = this.curve2d.toJSON();

		return data;

	}

	fromJSON(json) {

		super.fromJSON(json);

		this.curve2d.fromJSON(json.curve2d); // TODO: does this need a copy?

		return this;

	}

}

export { PlanarCurve3 };

